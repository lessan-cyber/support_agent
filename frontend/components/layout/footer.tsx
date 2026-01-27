export const Footer = () => {
  return (
    <footer className="w-full border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Support Agent. All rights reserved.
      </div>
    </footer>
  );
}