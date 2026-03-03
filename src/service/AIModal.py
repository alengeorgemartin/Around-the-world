# pip install google-genai

import os
from google import genai
from google.genai import types


def generate():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    model = "gemini-3-pro-preview"

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text("INSERT_INPUT_HERE"),
            ],
        ),
    ]

    # Correct way to define tools
    tools = [
        types.Tool(
            google_search=types.GoogleSearchTool(
                enable_store_results=True,
                store_results_as="search",
            )
        )
    ]

    # Correct thinking config
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH"
        ),
        tools=tools,
    )

    # Streaming response
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if chunk.candidates:
            for part in chunk.candidates[0].content.parts:
                if hasattr(part, "text"):
                    print(part.text, end="")


if __name__ == "__main__":
    generate()
