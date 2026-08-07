import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { SignaturePad } from "@/components/auth/SignaturePad";
import { OnboardingProgress } from "@/components/auth/OnboardingProgress";
import { PledgeAgreement } from "@/components/auth/PledgeAgreement";
import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Gender } from "@/types";

interface InstructorSignupFormProps {
  onSuccess: () => void;
}

const STEP_LABELS = [
  "신분증 · 정산계좌 인증",
  "강사 자격증 업로드",
  "보험 등록 (선택)",
  "플랫폼 윤리강령",
  "전자 서약",
  "관리자 승인",
];

const TOTAL_STEPS = STEP_LABELS.length;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ETHICS_CODE = [
  "모든 참가자를 성별, 국적, 신체 조건에 관계없이 동등하게 존중합니다.",
  "다이빙 안전 수칙과 장비 점검을 철저히 준수합니다.",
  "투어 정보와 자격 사항을 사실대로 정확히 게재합니다.",
  "플랫폼을 통해 발생한 문제는 성실히 협조하여 해결합니다.",
];

export function InstructorSignupForm({ onSuccess }: InstructorSignupFormProps) {
  const { addInstructorSignup } = useAppData();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // 계정 기본 정보 (기존 필드 유지)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [bio, setBio] = useState("");

  // 1) 신분증 인증
  const [idFiles, setIdFiles] = useState<File[]>([]);
  // 1) 정산 계좌 (통장사본)
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankbookFiles, setBankbookFiles] = useState<File[]>([]);
  // 2) 강사 자격증
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  // 3) 보험 등록 (선택)
  const [insuranceFiles, setInsuranceFiles] = useState<File[]>([]);
  // 4) 플랫폼 윤리강령
  const [ethicsAgreed, setEthicsAgreed] = useState(false);
  // 5) 전자 서약
  const [pledgeSignerName, setPledgeSignerName]
