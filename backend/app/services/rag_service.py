import os
from typing import Dict, Any
from fastapi import HTTPException

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from app.services.document_service import DocumentService

FAISS_STORE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "faiss_index")
os.makedirs(FAISS_STORE_DIR, exist_ok=True)

class RAGService:
    @staticmethod
    def get_index_path(doc_id: str) -> str:
        return os.path.join(FAISS_STORE_DIR, f"index_{doc_id}")

    @staticmethod
    async def index_document(doc_id: str, user_id: str) -> bool:
        # Fetch document
        doc = await DocumentService.get_document(doc_id, user_id)
        
        if doc['content_type'] != 'application/pdf':
            raise HTTPException(status_code=400, detail="Only PDF documents are supported for RAG indexing.")
            
        # Get actual file path
        storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "documents")
        physical_path = doc["file_path"].replace("/storage/documents/", "")
        full_path = os.path.join(storage_dir, physical_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Document file not found on disk.")
            
        # Extract text
        loader = PyPDFLoader(full_path)
        documents = loader.load()
        
        # Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_documents(documents)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="No extractable text found in the PDF.")
            
        # Embed and Store
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vectorstore = FAISS.from_documents(chunks, embeddings)
        
        index_path = RAGService.get_index_path(doc_id)
        vectorstore.save_local(index_path)
        return True

    @staticmethod
    async def chat_with_document(doc_id: str, user_id: str, question: str) -> Dict[str, Any]:
        # Ensure user owns doc
        await DocumentService.get_document(doc_id, user_id)
        
        index_path = RAGService.get_index_path(doc_id)
        if not os.path.exists(index_path):
            # Try to index it on the fly
            await RAGService.index_document(doc_id, user_id)
            
        return await RAGService._run_chat(index_path, question)

    @staticmethod
    async def chat_with_product(product_id: str, user_id: str, question: str) -> Dict[str, Any]:
        docs = await DocumentService.get_user_documents(user_id, product_id)
        if not docs:
            raise HTTPException(status_code=404, detail="No documents found for this product.")
            
        valid_indexes = []
        for doc in docs:
            if doc.get('content_type') == 'application/pdf':
                doc_id = doc.get("id")
                index_path = RAGService.get_index_path(doc_id)
                if not os.path.exists(index_path):
                    try:
                        await RAGService.index_document(doc_id, user_id)
                    except Exception:
                        pass
                if os.path.exists(index_path):
                    valid_indexes.append(index_path)
                    
        if not valid_indexes:
            raise HTTPException(status_code=400, detail="No valid indexed documents found for this product.")
            
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vectorstore = FAISS.load_local(valid_indexes[0], embeddings, allow_dangerous_deserialization=True)
        
        for idx in valid_indexes[1:]:
            vs_to_merge = FAISS.load_local(idx, embeddings, allow_dangerous_deserialization=True)
            vectorstore.merge_from(vs_to_merge)
            
        return await RAGService._run_chat_from_vectorstore(vectorstore, question)

    @staticmethod
    async def _run_chat(index_path: str, question: str) -> Dict[str, Any]:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vectorstore = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
        return await RAGService._run_chat_from_vectorstore(vectorstore, question)
        
    @staticmethod
    async def _run_chat_from_vectorstore(vectorstore, question: str) -> Dict[str, Any]:
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        
        prompt_template = """Use the following pieces of context to answer the user's question about the product manual.
If the answer cannot be found in the context, clearly state: "The manual does not provide enough information."
Do not rely on outside knowledge. Answer based strictly on the context.

Context:
{context}

Question: {question}
Answer:"""
        PROMPT = PromptTemplate.from_template(prompt_template)

        llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0)
        
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)
            
        docs = retriever.invoke(question)
        prompt_val = PROMPT.invoke({"context": format_docs(docs), "question": question})
        result = llm.invoke(prompt_val)
        
        answer = result.content if hasattr(result, "content") else str(result)
        
        formatted_sources = [
            {"page_content": d.page_content, "metadata": d.metadata} for d in docs
        ]
        
        return {
            "answer": answer,
            "sources": formatted_sources
        }
