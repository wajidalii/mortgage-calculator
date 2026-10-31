import AudienceSection from "@/features/home/components/AudienceSection";
import CapabilitiesSection from "@/features/home/components/CapabilitiesSection";
import FinalCta from "@/features/home/components/FinalCta";
import HeroSection from "@/features/home/components/HeroSection";
import HowItWorksSection from "@/features/home/components/HowItWorksSection";
import ToolsSection from "@/features/home/components/ToolsSection";
import TransparencySection from "@/features/home/components/TransparencySection";

const DESCRIPTION =
	"Estimate the full monthly cost of a home with tax, insurance, PMI and HOA. See cash to close, compare loans, test extra payments and check refinance break-even. Estimates only.";

const HomePage = () => (
	<>
		<title>Mortgage Calculator: plan the true cost of your home</title>
		<meta name="description" content={DESCRIPTION} />
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
