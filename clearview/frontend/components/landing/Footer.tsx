const Footer = () => {
  return (
    <footer className="py-8 px-4 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/images/logo-icon.svg" alt="Vera Fund" className="w-7 h-7 rounded-full" />
          <span className="text-sm font-bold text-foreground">
            Vera<span className="text-muted-foreground font-medium">Fund</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <p className="text-xs text-muted-foreground">
            © 2026 Vera Fund. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
