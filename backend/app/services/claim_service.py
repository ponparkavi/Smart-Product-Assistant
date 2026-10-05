from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.services.product_service import ProductService
import json

class ClaimService:
    @staticmethod
    async def generate_draft(product_id: str, user_id: str, issue_description: str) -> dict:
        product = await ProductService.get_product_by_id(product_id, user_id)
        
        verified_facts = {
            "Product Name": product["name"],
            "Brand": product["brand"],
            "Model Number": product["model_number"] or "Not specified",
            "Serial Number": product["serial_number"] or "Not specified",
            "Purchase Date": str(product["purchase_date"]),
            "Warranty End Date": str(product["warranty_end_date"]),
            "Warranty Status": product["warranty_status"]
        }

        prompt_template = """You are a helpful warranty claim assistant. 
Draft a professional warranty claim email/letter on behalf of the user to the manufacturer.

Verified Product Details:
- Brand: {brand}
- Product: {name}
- Model Number: {model}
- Serial Number: {serial}
- Purchase Date: {purchase_date}
- Warranty End Date: {end_date}

User's Issue Description: {issue}

Write a concise, formal warranty claim requesting repair or replacement. 
Do not include any placeholders for the user's name or address; just focus on the body of the claim and the product details. Ensure the verified facts are explicitly stated.
"""
        prompt = PromptTemplate.from_template(prompt_template)
        
        # Use a generic system user for LLM. If the key is not set, this might fail, so we catch it.
        try:
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.7)
            chain = prompt | llm
            result = chain.invoke({
                "brand": verified_facts["Brand"],
                "name": verified_facts["Product Name"],
                "model": verified_facts["Model Number"],
                "serial": verified_facts["Serial Number"],
                "purchase_date": verified_facts["Purchase Date"],
                "end_date": verified_facts["Warranty End Date"],
                "issue": issue_description
            })
            draft_text = result.content if hasattr(result, "content") else str(result)
        except Exception as e:
            # Fallback if Gemini isn't configured properly
            draft_text = f"Subject: Warranty Claim for {verified_facts['Product Name']}\n\nTo the {verified_facts['Brand']} Support Team,\n\nI am writing to file a warranty claim for my {verified_facts['Product Name']}. \n\nProduct Details:\n- Model: {verified_facts['Model Number']}\n- Serial Number: {verified_facts['Serial Number']}\n- Date of Purchase: {verified_facts['Purchase Date']}\n\nIssue Description:\n{issue_description}\n\nPlease advise on the next steps for repair or replacement under my active warranty.\n\nThank you."

        return {
            "draft_text": draft_text,
            "verified_facts": verified_facts
        }
