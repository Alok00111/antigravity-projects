"use client";

import dynamic from "next/dynamic";

const ValueProp3D = dynamic(
  () => import("@/components/sections/ValueProp3D"),
  { ssr: false }
);

export default function ValueProp3DWrapper() {
  return <ValueProp3D />;
}
