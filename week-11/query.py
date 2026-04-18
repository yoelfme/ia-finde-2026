import argparse
import sys

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector

load_dotenv()

COLLECTION_NAME = "codigos_de_guatemala"
CONNECTION = "postgresql+psycopg://postgres:postgres@localhost:5432/agentdb"

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vector_store = PGVector(
    embeddings=embeddings,
    collection_name=COLLECTION_NAME,
    connection=CONNECTION,
)


def run_similarity_search(query: str, k: int) -> None:
    results = vector_store.similarity_search(query=query, k=k)
    for i, doc in enumerate(results, 1):
        print(f"\n--- Resultado {i} ---")
        print(f"Metadata: {doc.metadata}")
        print(f"Content:\n{doc.page_content}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Semantic search over the ingested PDF chunks in PGVector.",
    )
    parser.add_argument(
        "query",
        nargs="*",
        help="Question (optional; if omitted, you will be prompted)",
    )
    parser.add_argument(
        "-k",
        type=int,
        default=4,
        metavar="N",
        help="Number of similar chunks to return (default: 4)",
    )
    args = parser.parse_args()

    if args.query:
        q = " ".join(args.query)
    else:
        q = input("Ingresa tu consulta: ").strip()
        if not q:
            print("Consulta vacía.", file=sys.stderr)
            sys.exit(1)

    run_similarity_search(q, k=args.k)


if __name__ == "__main__":
    main()
