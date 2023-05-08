import "../node_modules/as-wasi/assembly/index";
import { JSON } from "../node_modules/assemblyscript-json/assembly/index";

import {Console, CommandLine} from "../node_modules/as-wasi/assembly/";
import { proc_exit } from "@assemblyscript/wasi-shim/assembly/bindings/wasi_snapshot_preview1";




main();

export function main(): void {
    //read in command line arguments such as action, from and to
    //we can ignore argument zero because it is just this file.
    const args = new CommandLine().args;   
    
    //can either be manifest or transform 
    const action = args[1];

    if (action == "manifest") {
        manifest();
    } else if (action == "transform") {
        // here args[2] is from and args[3] is to
        transform(args[2], args[3]);
    } else {
        Console.log("invalid action " + action)
    }

    proc_exit(0);
}

function transform(from: string, to: string): void {
    // here you can add more cases if you support more than one transform
    if (from == "template") {
        transform_vigenere(to);
    }else{
        Console.error("package does not support " + from)
    }
}

function transform_vigenere(to: string): void {
    const stdin: string | null = Console.readAll();
    if (stdin == null) {
        //if stdin is null then there was an error reading from stdin and we should exit
        Console.error("stdin is null");
        proc_exit(1);
    }

    // this is all the data you get when your package is called
    const data = <JSON.Obj>(JSON.parse(stdin));

    // this is the text that you should transform
    const text: string = data.getString("data")!.toString();

    // this is the arguments that your transform takes such as fonte size etc.
    const args = <JSON.Obj>(data.get("arguments"));
    
    // split the text into lines so that we can split it into paragraphs
    let text_arr = text.split("\n");

    let result = "";
    if (to == "html") {
        result = html(text_arr);
    }else if(to == "latex") {
        result = latex(text_arr);
    }else {
        Console.error("package does not support " + to);
        return;
    }
    
    Console.log(result);
}
 
function html(lines: string[]) : string{
    let jsonArr = new JSON.Arr();
    for (let i = 0; i < lines.length; i++) {
        jsonArr.push(raw("<p>"+lines[i]+"</p>"));
    }
    return jsonArr.stringify();
}

function latex(lines: string[]) : string{
    let jsonArr = new JSON.Arr();
    for (let i = 0; i < lines.length; i++) {
        jsonArr.push(raw(escape_latex(lines[i])));
        jsonArr.push(raw("\\\\"));
    }
    return jsonArr.stringify();
}

function raw(text: string): JSON.Obj {
    // all returned text must be encoded using this function
    let obj = new JSON.Obj();
    obj.set("name", "raw");
    obj.set("data", text);
    return obj;
}

function escape_latex(text: string) : string{
    // this function escapes all the special characters in latex
    let result : string= text.split('\\')
    .map((t: string) =>
      t.replace('{', '\\{')
        .replace('}', '\\}')
    )
    .join('\\textbackslash{}')
    .replace('#', '\\#')
    .replace('$', '\\$')
    .replace('%', '\\%')
    .replace('&', '\\&')
    .replace('_', '\\_')
    .replace('<', '\\textless{}')
    .replace('>', '\\textgreater{}')
    .replace('~', '\\textasciitilde{}')
    .replace('^', '\\textasciicircum{}');

    return result;
}

function manifest(): void {
    // all packages must have a manifest function that returns a manifest contating arguments and supported transforms
    Console.log('{"name": "template" ,"version":"1.0.0","description":"This is a template package","transforms":[{"from":"template","to":["html","latex"],"arguments":[]}]}');
    proc_exit(0);
}