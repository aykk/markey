const NAV_LINKS = ['Catalog', 'Systems', 'About'] as const;

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 py-6">
      <span className="font-mono text-[10px] tracking-[0.55em] text-black uppercase select-none">
        3FIL
      </span>

      <div className="hidden md:flex items-center gap-10">
        {NAV_LINKS.map((item) => (
          <a
            key={item}
            href="#"
            className="font-mono text-[9px] tracking-[0.3em] text-neutral-500 hover:text-black uppercase transition-colors duration-300"
          >
            {item}
          </a>
        ))}
      </div>

      <button
        aria-label="Menu"
        className="md:hidden flex flex-col gap-[5px] group"
      >
        <span className="block h-px w-5 bg-neutral-500 group-hover:bg-black transition-colors" />
        <span className="block h-px w-3 bg-neutral-500 group-hover:bg-black transition-colors" />
      </button>
    </nav>
  );
}
