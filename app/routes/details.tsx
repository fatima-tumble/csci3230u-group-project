import Header from "../components/header"
import Tag from "../components/tags"

export default function Details() {
  return <>
    <Header />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-[95%] mx-auto">
        <section>
            <h1 className="text-2xl font-bold mt-4">Place Name</h1>
            <h4 className="text-sm font-extralight mb-2 text-gray-300">Address</h4>
            <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>1.2 km away</span>
                <span aria-hidden="true">•</span>
                <span>Open until 6 PM</span>
            </div>
            <div className="mt-4 border-[#494949] border-2 flex flex-col rounded-[10px] p-4 min-h-5/6">
                <h1 className="font-bold">Description</h1>
                <h4 className="font-normal">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent at dolor nec nibh ultricies elementum et a risus. Maecenas fringilla non felis luctus volutpat</h4>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-500">Tags</h1>
            <div className="mt-4 flex flex-row flex-wrap rounded-[10px] gap-3">
                <Tag>Test</Tag>
                <Tag>Test</Tag>
                <Tag>Test</Tag>
            </div>
        </section>
        <section>
            <h1 className="mt-4 text-2xl font-bold text-gray-500">Map</h1>
            <div className="mt-4 border-[#494949] border-2 flex flex-col rounded-[10px] min-h-5/6 p-4">

            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-500">Gallery</h1>
            <div className="mt-4 border-[#494949] border-2 flex flex-col rounded-[10px] min-h-5/6 p-4">

            </div>
        </section>
    </div>
  </>
}
