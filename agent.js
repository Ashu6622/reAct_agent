import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import z from 'zod'
import readline from 'node:readline/promises'
import { writeFileSync } from "node:fs";
import {MemorySaver} from "@langchain/langgraph";

// added the memory(short term memory)

async function main() {
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const search = new TavilySearch({
    maxResults: 3,
    topic: "general",
  });

  // custom tool
  const calenderEvent = tool(
    async ({ query }) => {
    
        return JSON.stringify([
            {title:'Meeting with Sujoy',date: "24th September 2025", time:'2 PM', location: 'Gmeet'}
        ])
    },
    {
      name: "get-calender-events",
      description: "call to get the calendar events.",
      schema: z.object({
        query: z.string().describe("The query to use in your search."),
      }),
    }
  );
  
  const checkpointer = new MemorySaver();

  const agent = createReactAgent({
    llm: model,
    tools: [search, calenderEvent],
    checkpointer: checkpointer
  });


   const rl = readline.createInterface({input: process.stdin, output: process.stdout});

  while(true){

     const question = await rl.question('You : ');
      if(question === 'exit' || question === 'quit'){
        break;
    }
      
      const result = await agent.invoke({
          messages: [
              {
                role:'system',
                content:`You are a personal assistance. Use the provided tools to get the information if u don't have it`
              },
              {
                role: "user",
                content: question,
              },
          ],
          },
          {configurable: {thread_id:'1'}}
        );
        console.log(result.messages[result.messages.length - 1].content);
      }

      const drawableGraphGraphState = await agent.getGraphAsync();
      const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
      const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

      const filePath = "./graphState.png";
      writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));


rl.close();
}

main();
