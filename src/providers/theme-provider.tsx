import { ThemeProvider as NextThemeProvider } from 'next-themes';

type TThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider = ({ children }: TThemeProviderProps) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
};
