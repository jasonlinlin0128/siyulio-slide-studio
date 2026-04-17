import { Metadata } from "next";
import CreateWizard from "@/components/CreateWizard";

export const metadata: Metadata = {
  title: "立即產生簡報 | Siyulio Slide Studio",
};

export default function CreatePage() {
  return <CreateWizard />;
}
