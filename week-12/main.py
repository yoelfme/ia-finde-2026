import requests, pathlib
from langchain_community.utilities import SQLDatabase # conectar a la base de datos
from langchain_community.agent_toolkits import SQLDatabaseToolkit # herramientas para la base de datos
from langchain_openai import ChatOpenAI
from langchain.chat_models import init_chat_model # LLM que usaremos
from langchain.agents import create_agent
from dotenv import load_dotenv

load_dotenv()

# model = init_chat_model("gpt-5.2")



# Initialize the model pointing to LM Studio
model = ChatOpenAI(
    base_url="http://localhost:1234/v1", # The LM Studio server URL
    api_key="not-needed",                # Required field, but any string works
    temperature=0.7
)

url = "https://storage.googleapis.com/benchmarks-artifacts/chinook/Chinook.db"
local_path = pathlib.Path("Chinook.db")

if local_path.exists():
    print(f"{local_path} already exists, skipping download.")
else:
    response = requests.get(url)
    if response.status_code == 200:
        local_path.write_bytes(response.content)
        print(f"File downloaded and saved as {local_path}")
    else:
        print(f"Failed to download the file. Status code: {response.status_code}")

db = SQLDatabase.from_uri("sqlite:///Chinook.db")
# db = SQLDatabase.from_uri("postgresql://postgres:password@localhost:5432/chinook")


toolkit = SQLDatabaseToolkit(db=db, llm=model)

tools = toolkit.get_tools()

system_prompt = """
You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct {dialect} query to run,
then look at the results of the query and return the answer. Unless the user
specifies a specific number of examples they wish to obtain, always limit your
query to at most {top_k} results.

You can order the results by a relevant column to return the most interesting
examples in the database. Never query for all the columns from a specific table,
only ask for the relevant columns given the question.

You MUST double check your query before executing it. If you get an error while
executing a query, rewrite the query and try again.

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the
database.

To start you should ALWAYS look at the tables in the database to see what you
can query. Do NOT skip this step.

Then you should query the schema of the most relevant tables.
""".format(
    dialect=db.dialect,
    top_k=20,
)

agent = create_agent(
    model,
    tools,
    system_prompt=system_prompt,
)