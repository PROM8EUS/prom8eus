import { ReactNode } from "react";

interface StaticPageTemplateProps {
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const StaticPageTemplate = ({ title, children, maxWidth = "lg" }: StaticPageTemplateProps) => {
  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-3xl", 
    lg: "max-w-4xl",
    xl: "max-w-5xl",
    "2xl": "max-w-6xl"
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 px-6 py-32">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto space-y-12`}>
          
          {/* Page Title */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {title}
            </h1>
          </section>

          {/* Page Content */}
          <section className="prose prose-lg max-w-none">
            <div className="space-y-8 text-foreground">
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default StaticPageTemplate;

