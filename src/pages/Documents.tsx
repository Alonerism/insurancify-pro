import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Search, Upload, MoreVertical, Download, Eye, Calendar, Building } from "lucide-react";

const mockDocuments = [
  {
    id: 1,
    fileName: "GL-Policy-2024-001.pdf",
    type: "Policy Document",
    linkedEntity: "General Liability Policy",
    linkedProperty: "Downtown Office Complex",
    uploadDate: "2024-01-15",
    fileSize: "2.4 MB",
    tags: ["General Liability", "Policy", "2024"],
    uploadedBy: "Sarah Mitchell",
  },
  {
    id: 2,
    fileName: "Property-Insurance-Certificate.pdf",
    type: "Certificate of Insurance",
    linkedEntity: "Property Insurance Policy",
    linkedProperty: "Oak Tower Building",
    uploadDate: "2024-01-12",
    fileSize: "1.8 MB",
    tags: ["Property", "Certificate", "COI"],
    uploadedBy: "John Smith",
  },
  {
    id: 3,
    fileName: "Water-Damage-Claim-Photos.pdf",
    type: "Claim Documentation",
    linkedEntity: "Claim CLM-2024-001",
    linkedProperty: "Oak Tower Building",
    uploadDate: "2024-01-10",
    fileSize: "5.2 MB",
    tags: ["Claim", "Water Damage", "Photos"],
    uploadedBy: "Lisa Rodriguez",
  },
  {
    id: 4,
    fileName: "Building-Inspection-Report-2024.pdf",
    type: "Inspection Report",
    linkedEntity: "Annual Inspection",
    linkedProperty: "Riverside Apartments",
    uploadDate: "2024-01-08",
    fileSize: "3.1 MB",
    tags: ["Inspection", "Building", "Annual"],
    uploadedBy: "Michael Chen",
  },
];

const getDocumentTypeBadge = (type: string) => {
  const typeMap = {
    "Policy Document": { variant: "default" as const, text: "Policy" },
    "Certificate of Insurance": { variant: "secondary" as const, text: "COI" },
    "Claim Documentation": { variant: "destructive" as const, text: "Claim" },
    "Inspection Report": { variant: "outline" as const, text: "Inspection" },
  };
  
  const config = typeMap[type as keyof typeof typeMap] || { variant: "outline" as const, text: type };
  return <Badge variant={config.variant}>{config.text}</Badge>;
};

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocuments = mockDocuments.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.linkedEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalDocuments = mockDocuments.length;
  const totalSize = mockDocuments.reduce((sum, doc) => sum + parseFloat(doc.fileSize.replace(/[^\d.]/g, '')), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Manage policy documents, certificates, claims files, and reports
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Files in library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSize.toFixed(1)} MB</div>
            <p className="text-xs text-muted-foreground">
              Total file size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Docs</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDocuments.filter(d => d.type === "Policy Document").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDocuments.filter(d => d.type === "Certificate of Insurance").length}
            </div>
            <p className="text-xs text-muted-foreground">
              COI documents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search documents by name, type, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter by Type</Button>
            <Button variant="outline">Filter by Property</Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked To</TableHead>
                <TableHead>Upload Info</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{doc.fileName}</div>
                        <div className="text-sm text-muted-foreground">{doc.fileSize}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getDocumentTypeBadge(doc.type)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.linkedEntity}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {doc.linkedProperty}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {doc.uploadDate}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        by {doc.uploadedBy}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Document
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Tags</DropdownMenuItem>
                        <DropdownMenuItem>Delete Document</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}