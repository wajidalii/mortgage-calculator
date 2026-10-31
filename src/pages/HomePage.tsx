import AudienceSection from "@/features/home/components/AudienceSection";
import CapabilitiesSection from "@/features/home/components/CapabilitiesSection";
import FinalCta from "@/features/home/components/FinalCta";
import HeroSection from "@/features/home/components/HeroSection";
import HowItWorksSection from "@/features/home/components/HowItWorksSection";
import ToolsSection from "@/features/home/components/ToolsSection";
import TransparencySection from "@/features/home/components/TransparencySection";

const HomePage = () => (
	<>
		<title>Mortgage Calculator: plan the true cost of your home</title>
		<HeroSection />
		<ToolsSection />
		<CapabilitiesSection />
		<HowItWorksSection />
		<AudienceSection />
		<TransparencySection />
		<FinalCta />
	</>
);

export default HomePage;
