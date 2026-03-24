import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved preference or system preference
    let shouldBeDark = false;
    try {
      const saved = localStorage.getItem('theme');
      shouldBeDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.error('localStorage access failed:', error);
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDark;
    setIsDark(newValue);

    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.293 1.707a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2 2.828a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM18 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm1.707 2.293a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-1.707-2.293a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.293-1.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm1.707-2.293a1 1 0 00-1.414-1.414L1.586 7.586a1 1 0 001.414 1.414l.707-.707zM2 5a1 1 0 011 1v1a1 1 0 11-2 0V6a1 1 0 011-1zm5-2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM7 10a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
