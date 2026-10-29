export default function Header() {
    return (
        <header className="flex items-center justify-between gap-x-4 py-4 px-6 w-full max-w-6xl mx-auto flex-wrap bg-bone text-brand">
            <h1 className="text-2xl sm:text-3xl font-bold">Location</h1>
            <nav>
                <ul className="flex gap-4 sm:gap-6 text-base sm:text-lg font-medium">
                    <li><a href="/" className="hover:underline">Home</a></li>
                    <li><a href="/explore" className="hover:underline">Explore</a></li>
                    <li><a href="/about" className="hover:underline">About</a></li>
                </ul>
            </nav>
        </header>
    );
}