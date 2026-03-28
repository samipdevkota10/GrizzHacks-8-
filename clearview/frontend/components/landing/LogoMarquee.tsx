"use client";

const logos = [
  "/images/logo1.png",
  "/images/logo2.png",
  "/images/logo3.png",
  "/images/logo4.png",
  "/images/logo5.png",
  "/images/logo6.png",
  "/images/logo7.png",
  "/images/logo8.png",
];

const LogoMarquee = () => {
  return (
    <section className="py-10 overflow-hidden bg-background">
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-8 flex items-center justify-center h-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <img src={logo} alt="Partner logo" className="h-6 w-auto object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoMarquee;
