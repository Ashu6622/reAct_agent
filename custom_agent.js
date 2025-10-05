import 'dotenv/config';
import { ChatGroq } from "@langchain/groq";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { TavilySearch } from "@langchain/tavily";
import z from 'zod';
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import {MemorySaver} from "@langchain/langgraph";
import readline from 'node:readline/promises'


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


const tools = [search, calenderEvent]
const toolNode = new ToolNode(tools);


function shouldContinue(state){

    
    if(state.messages[state.messages.length-1].tool_calls?.length){
        return 'tools';
    }
    else{
        // console.log('message', state.messages);
        return '__end__';
    }
}


// Initialise the LLM
const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
}).bindTools(tools);


async function callModel(state){
    
    // console.log('calling the llm')
    const response = await llm.invoke(state.messages);  //state is just like a message array of current prompt
    // console.log('Response in callMode: ', response);
    return {messages: [response]}; //the data which is return from here is get added to the state  
}
 

// Build the graph
const graph = new StateGraph(MessagesAnnotation)
.addNode('llm', callModel)
.addNode('tools', toolNode)
.addEdge('__start__', 'llm')
.addEdge('tools', 'llm')
.addConditionalEdges('llm', shouldContinue,{
    __end__:END,
    tools:'tools'
});

const checkpointer = new MemorySaver();

const app = graph.compile({checkpointer});



async function main(){

    let config = {configurable: {thread_id:'1'}}
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});

    while(true){

        const question = await rl.question('You : ');
            if(question === 'exit' || question === 'quit'){
                break;
            }
        const result = await app.invoke({
            messages: [
            {role:'user', content:question},
        ]  
        },
             config
        )
        
        console.log(result.messages[result.messages.length-1].content);

    }
    rl.close();

}

main();