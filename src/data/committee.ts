import { placeholderImage } from "@/lib/utils";
import type { CommitteeMember } from "@/types";

export const coreCommittee: CommitteeMember[] = [
  { id: "core-1", name: "Aarav Sharma", position: "President", year: "2025–26", photo: placeholderImage("actcet-core-1", 300, 300) },
  { id: "core-2", name: "Diya Mehta", position: "Vice President", year: "2025–26", photo: placeholderImage("actcet-core-2", 300, 300) },
  { id: "core-3", name: "Kabir Nair", position: "General Secretary", year: "2025–26", photo: placeholderImage("actcet-core-3", 300, 300) },
  { id: "core-4", name: "Ishita Rao", position: "Treasurer", year: "2025–26", photo: placeholderImage("actcet-core-4", 300, 300) },
];

export const workingCommittee: CommitteeMember[] = [
  { id: "work-1", name: "Rohan Iyer", position: "Events Head", year: "2025–26", photo: placeholderImage("actcet-work-1", 300, 300) },
  { id: "work-2", name: "Sanya Kapoor", position: "Outreach Head", year: "2025–26", photo: placeholderImage("actcet-work-2", 300, 300) },
  { id: "work-3", name: "Vivaan Joshi", position: "Technical Head", year: "2025–26", photo: placeholderImage("actcet-work-3", 300, 300) },
  { id: "work-4", name: "Anaya Desai", position: "Design Head", year: "2025–26", photo: placeholderImage("actcet-work-4", 300, 300) },
  { id: "work-5", name: "Aditya Verma", position: "Podcast Lead", year: "2025–26", photo: placeholderImage("actcet-work-5", 300, 300) },
  { id: "work-6", name: "Meera Pillai", position: "Social Media Lead", year: "2025–26", photo: placeholderImage("actcet-work-6", 300, 300) },
  { id: "work-7", name: "Arjun Shetty", position: "Logistics Lead", year: "2025–26", photo: placeholderImage("actcet-work-7", 300, 300) },
  { id: "work-8", name: "Neha Choudhary", position: "Content Lead", year: "2025–26", photo: placeholderImage("actcet-work-8", 300, 300) },
];

export const formerCommittee: CommitteeMember[] = [
  { id: "former-1", name: "Karan Malhotra", position: "Former President", year: "2024–25", photo: placeholderImage("actcet-former-1", 300, 300) },
  { id: "former-2", name: "Priya Nambiar", position: "Former Vice President", year: "2024–25", photo: placeholderImage("actcet-former-2", 300, 300) },
  { id: "former-3", name: "Yash Kulkarni", position: "Former General Secretary", year: "2023–24", photo: placeholderImage("actcet-former-3", 300, 300) },
  { id: "former-4", name: "Tanya Bhatt", position: "Former Treasurer", year: "2023–24", photo: placeholderImage("actcet-former-4", 300, 300) },
];
