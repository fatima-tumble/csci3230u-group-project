export default function Header() {
    return (
        <header className="flex items-center justify-between p-4 w-[95%] mx-auto border-[#494949] border-2 shadow-2xl m-4 rounded-[10px]">
            <h1 className="text-2xl font-bold">Location</h1>
            <input type="text" className="text-sm font-bold bg-[#1E1D1D] border-[#494949] border-2 ml-auto mr-4 p-2 rounded-[10px]" placeholder="Search"/>
            <nav>
                <ul className="flex gap-4">
                    <li><a href="/" className="">Home</a></li>
                    <li><a href="/explore" className="">Explore</a></li>
                    <li><a href="/about" className="">About</a></li>
                </ul>
            </nav>
        </header>
    );
}