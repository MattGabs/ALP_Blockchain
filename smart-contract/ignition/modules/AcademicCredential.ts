import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AcademicCredentialModule", (m) => {
  const academicCredential = m.contract("AcademicCredential");

  return { academicCredential };
});