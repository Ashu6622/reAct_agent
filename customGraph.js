import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

function cutVegetables(state){
    console.log('Cutting the vegetables...')
    return state;
}

function boilRice(state){
    console.log('Boiling the rice...')
    return state;
}

function addSalt(state){
    console.log('Add the Salt...')
    return state;
}

function tasteBiryani(state){
    console.log('Taste the Biryani...')
    return state;
}

function whereToGo(state){

    if(true){
        return "__end__"
    }
    else{
        return "addtheSalt"
    }
}

const graph =  new StateGraph(MessagesAnnotation).addNode("cuttheVegetable", cutVegetables)
.addNode('boiltheRice', boilRice)
.addNode('addtheSalt', addSalt)
.addNode('tastetheBiryani', tasteBiryani)
.addEdge("__start__", "cuttheVegetable" )
.addEdge("cuttheVegetable", "boiltheRice" )
.addEdge("boiltheRice", "addtheSalt" )
.addEdge("addtheSalt", "tastetheBiryani" )
.addConditionalEdges("tastetheBiryani", whereToGo)


const process = graph.compile();  

async function main(){
    const finalState = await process.invoke({
        message:[]
    })

    console.log('final', finalState);
}

main();