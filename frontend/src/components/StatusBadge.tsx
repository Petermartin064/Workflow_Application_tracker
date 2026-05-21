import {
  Pencil,
  Send,
  Search,
  ClipboardList,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ApplicationStatus } from "../types";

interface Props {
  status: ApplicationStatus;
}

const STATUS_ICONS: Record<ApplicationStatus, React.ReactNode> = {
  Draft:                   <Pencil size={11} />,
  Submitted:               <Send size={11} />,
  "Under Review":          <Search size={11} />,
  "Need More Information": <ClipboardList size={11} />,
  Approved:                <CheckCircle size={11} />,
  Rejected:                <XCircle size={11} />,
};

function statusClass(status: string) {
  return "status-" + status.replace(/\s+/g, "-");
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`status-badge ${statusClass(status)}`}>
      <span className="badge-icon">{STATUS_ICONS[status]}</span>
      {status}
    </span>
  );
}
