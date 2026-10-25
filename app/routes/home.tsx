import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Header  from "../components/header";
import Tag from "../components/tags";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <>
    <Header />
    <div className="flex items-center justify-between border-[#494949] border-2 flex-col rounded-[10px] m-4 w-[95%] mx-auto">
        <h1 className="mt-4 text-2xl font-bold mb-4">Discover places near you</h1>
        <div className="flex items-center">
          <input type="text" className="text-sm font-bold bg-[#1E1D1D] border-[#494949] border-2 m-4 p-2 rounded-[10px]" placeholder="Enter your postal code or city"/>
          <button className="text-sm font-bold bg-[#474747] p-2 rounded-[10px]">Search</button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Or</h1>
        <button className="text-sm font-bold bg-[#474747] p-2 rounded-[10px] mb-4">Use my location</button>
    </div>
    <div className="flex justify-between flex-col rounded-[10px] m-4 w-[95%] mx-auto">
        <h1 className="text-2xl font-bold mt-4">Explore by category</h1>
        <div className="mt-4 flex flex-row flex-wrap rounded-[10px] gap-3">
            <Tag>Test</Tag>
            <Tag>Test</Tag>
            <Tag>Test</Tag>
        </div>
    </div>
  </>
}
