import { useState, useMemo } from "react";
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
import { FileText, Search, Upload, MoreVertical, Download, Eye, Calendar, Building, Loader2 } from "lucide-react";
import { usePolicies } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";

interface DocumentData {
  id: number;
  fileName: string;
  type: string;
  linkedEntity: string;
  linkedProperty: string;
  uploadDate: string;
  fileSize: string;
  tags: string[];
  uploadedBy: string;
}

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
  
  const { data: policies = [], isLoading, error } = usePolicies();

  // Transform policies into document data
  const documents: DocumentData[] = useMemo(() => {
    return policies.map((policy, index) => ({
      id: index + 1,
      fileName: `${policy.policyNumber || `Policy-${policy.id}`}.pdf`,
      type: "Policy Document",
      linkedEntity: `${policy.coverageType || 'Insurance'} Policy`,
      linkedProperty: `Property ${policy.buildingId || 'Unknown'}`,
      uploadDate: policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : new Date().toLocaleDateString(),
      fileSize: "2.1 MB", // Placeholder since we don't have file size data
      tags: [policy.coverageType || 'Policy', policy.carrier || 'Insurance', new Date().getFullYear().toString()],
      uploadedBy: "System", // Placeholder since we don't have user data
    }));
  }, [policies]);

  const filteredDocuments = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.linkedEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalDocuments = documents.length;
  const totalSize = documents.reduce((sum, doc) => sum + parseFloat(doc.fileSize.replace(/[^\d.]/g, '')), 0);

  const handleUploadDocument = () => {
    toast({
      title: "Coming Soon",
      description: "Document upload feature will be available soon.",
    });
  };

  const handleDocumentAction = (action: string, docName: string) => {
    toast({
      title: "Coming Soon",
      description: `${action} for ${docName} will be available soon.`,
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load documents</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
        <Button onClick={handleUploadDocument}>
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
              {documents.filter(d => d.type === "Policy Document").length}
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
              {documents.filter(d => d.type === "Certificate of Insurance").length}
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
            <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Filter by type feature coming soon" })}>
              Filter by Type
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Filter by property feature coming soon" })}>
              Filter by Property
            </Button>
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
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
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
                          <DropdownMenuItem onClick={() => handleDocumentAction("View Document", doc.fileName)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Document
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDocumentAction("Download", doc.fileName)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDocumentAction("Edit Tags", doc.fileName)}>
                            Edit Tags
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDocumentAction("Delete Document", doc.fileName)}>
                            Delete Document
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}