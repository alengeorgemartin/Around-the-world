import sys
import json
import os
from google import genai
from google.genai import types

from dotenv import load_dotenv
load_dotenv()


def generate_json(prompt):
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    model ="gemini-2.0-flash"

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    tools = [
        types.Tool(googleSearch=types.GoogleSearch())
    ]

    config = types.GenerateContentConfig(
        tools=tools,
    )

    # Get full response (NOT streaming)
    result = client.models.generate_content(
        model=model,
        contents=contents,
        config=config
    )

    # Convert AI output to JSON
    text_output = result.text

    try:
        parsed_json = json.loads(text_output)
        return parsed_json
    except:
        # If Gemini returns text, wrap it into a JSON object
        return {"response": text_output}

# -----------------------
# Main Script Execution
# -----------------------

prompt = sys.argv[1]
response = generate_json(prompt)

# Print ONLY JSON (VERY IMPORTANT)
print(json.dumps(response))
