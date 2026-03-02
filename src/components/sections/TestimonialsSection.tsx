"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";


// Interfaces
interface Testimonial {
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    isCasual: boolean;
    avatarSource: "grid1" | "grid2" | "duo";
    avatarPosition: "tl" | "tr" | "bl" | "br" | "l" | "r";
}

const testimonials: Testimonial[] = [
    {
        id: "1",
        name: "Alex K.",
        role: "Lead Developer",
        company: "PixelForge Games",
        content: "Bro, the Verified Agent literally saved my launch. Found a memory leak in the matchmaking lobby that me and the team missed for weeks. 10/10.",
        isCasual: true,
        avatarSource: "grid1",
        avatarPosition: "tl",
    },
    {
        id: "2",
        name: "Dr. Sarah Chen",
        role: "CTO",
        company: "MedCore Health",
        content: "HIPAA compliance is usually a nightmare of paperwork. CodeSleuth's Security Agent automated our entire audit trail. It’s rigorous, precise, and indispensable.",
        isCasual: false,
        avatarSource: "grid1",
        avatarPosition: "tr",
    },
    {
        id: "3",
        name: "Mike R.",
        role: "E-com Manager",
        company: "ShopifyPlus Store",
        content: "I was drowning in inventory sync bugs. The Builder agent just... fixed it? Like, it actually understood our messy legacy code. Wild.",
        isCasual: true,
        avatarSource: "grid1",
        avatarPosition: "bl",
    },
    {
        id: "4",
        name: "James T.",
        role: "Ops Director",
        company: "Apex Manufacturing",
        content: "The reliability of our SCADA integrations has passed every stress test. CodeSleuth enforces a level of discipline that human teams simply cannot maintain at scale.",
        isCasual: false,
        avatarSource: "grid1",
        avatarPosition: "br",
    },
    {
        id: "5",
        name: "Elena V.",
        role: "VP Engineering",
        company: "Nova Finance",
        content: "We migrated our trading engine with zero downtime. The Technical Design Agent spotted a race condition in the planning phase that would have cost us millions.",
        isCasual: false,
        avatarSource: "grid2",
        avatarPosition: "tl",
    },
    {
        id: "6",
        name: "Chloe M.",
        role: "Brand Tech Lead",
        company: "Luxe Fashion",
        content: "Our 3D viewer kept crashing on mobile. The Verifier agent bullied us into fixing the performance issues and now it's buttery smooth. Love it.",
        isCasual: true,
        avatarSource: "grid2",
        avatarPosition: "tr",
    },
    {
        id: "7",
        name: "Rick D.",
        role: "Supply Chain Coord",
        company: "FreshFoods",
        content: "Dude, the 'Green = Ship' rule is a lifesaver. We used to ship bug-ridden updates every Friday. Now nothing goes out unless it's actually solid.",
        isCasual: true,
        avatarSource: "grid2",
        avatarPosition: "bl",
    },
    {
        id: "8",
        name: "Tom H.",
        role: "Field Tech Mgr",
        company: "BuildRight",
        content: "Connectivity on job sites is trash. But the Offline-First architecture the Planner agent suggested works perfectly. Totally game changing.",
        isCasual: true,
        avatarSource: "grid2",
        avatarPosition: "br",
    },
    {
        id: "9",
        name: "Sam J.",
        role: "Founder",
        company: "Stealth Startup",
        content: "I thought my code was good. Then the Critic Agent roasted my entire monetization strategy. It hurt, but it was right. We pivoted and doubled revenue.",
        isCasual: true,
        avatarSource: "duo",
        avatarPosition: "l",
    },
    {
        id: "10",
        name: "Jess L.",
        role: "Agency Lead",
        company: "Viral Marketing",
        content: "Managing 50 client sites was chaos. Now CodeSleuth handles the updates and security checks. I actually get to sleep on weekends now.",
        isCasual: true,
        avatarSource: "duo",
        avatarPosition: "r",
    },
];

const Avatar = ({ source, position }: { source: string; position: string }) => {
    let imageSrc = "";
    if (source === "grid1") imageSrc = "/images/testimonials/avatars_grid_1.png";
    if (source === "grid2") imageSrc = "/images/testimonials/avatars_grid_2.png";
    if (source === "duo") imageSrc = "/images/testimonials/avatars_duo.png";

    // CSS Sprite Logic
    const style: React.CSSProperties = {
        backgroundImage: `url(${imageSrc})`,
        backgroundRepeat: "no-repeat",
    };

    if (source === "grid1" || source === "grid2") {
        style.backgroundSize = "200% 200%";
        if (position === "tl") style.backgroundPosition = "0% 0%";
        if (position === "tr") style.backgroundPosition = "100% 0%";
        if (position === "bl") style.backgroundPosition = "0% 100%";
        if (position === "br") style.backgroundPosition = "100% 100%";
    } else if (source === "duo") {
        style.backgroundSize = "200% 100%";
        if (position === "l") style.backgroundPosition = "0% 0%";
        if (position === "r") style.backgroundPosition = "100% 0%";
    }

    return (
        <div className="w-12 h-12 rounded-full border border-border bg-surface-elevated flex-shrink-0 overflow-hidden relative">
            <div className="absolute inset-0" style={style} />
        </div>
    );
};

export function TestimonialsSection() {
    return (
        <section className="section bg-background-subtle border-y border-border">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-12"
                >
                    <span className="badge badge-secondary mb-4">Community Feedback</span>
                    <h2 className="mb-4">
                        Trusted by <span className="gradient-text">Builders</span> Everywhere
                    </h2>
                    <p className="text-foreground-muted text-lg">
                        From solo founders to enterprise CTOs, see how CodeSleuth is transforming development workflows across every industry.
                    </p>
                </motion.div>

                {/* Scrolling Marquee / Masonry Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-6">
                        {testimonials.slice(0, 4).map((t, i) => (
                            <TestimonialCard key={t.id} testimonial={t} index={i} />
                        ))}
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-6">
                        {testimonials.slice(4, 7).map((t, i) => (
                            <TestimonialCard key={t.id} testimonial={t} index={i + 4} />
                        ))}
                    </div>

                    {/* Column 3 (Hidden on small screens, merged on medium) */}
                    <div className="space-y-6 md:hidden lg:block">
                        {testimonials.slice(7, 10).map((t, i) => (
                            <TestimonialCard key={t.id} testimonial={t} index={i + 7} />
                        ))}
                    </div>
                    {/* Mobile Only: Show remaining items if hidden by col logic? 
                         Actually, standard masonry usually splits evenly. 
                         Let's just use CSS columns or simple distribution.
                         10 items / 3 cols = 3/3/4.
                     */}
                </div>

                {/* Mobile/Tablet View Adjustment */}
                <div className="lg:hidden mt-6 space-y-6 hidden md:block">
                    {/* Render the last few items for tablet if they were in col 3 */}
                    {testimonials.slice(7, 10).map((t, i) => (
                        <TestimonialCard key={t.id} testimonial={t} index={i + 7} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-colors shadow-sm"
        >
            <div className="mb-4 text-primary opacity-50">
                <Quote className="w-8 h-8" />
            </div>
            <p className="text-foreground text-lg mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
            </p>
            <div className="flex items-center gap-3">
                <Avatar source={testimonial.avatarSource} position={testimonial.avatarPosition} />
                <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-xs text-foreground-muted">
                        {testimonial.role}, {testimonial.company}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
