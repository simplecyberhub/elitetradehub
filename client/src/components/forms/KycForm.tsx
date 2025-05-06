import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitKycDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

// Define KYC form schema
const kycFormSchema = z.object({
  documentType: z.enum(["passport", "drivers_license", "national_id"], {
    required_error: "Please select a document type",
  }),
  documentNumber: z.string()
    .min(3, "Document number must be at least 3 characters")
    .max(50, "Document number must be less than 50 characters"),
  expiryDate: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().optional(),
  zipCode: z.string().min(2, "Zip code must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
});

type KycFormValues = z.infer<typeof kycFormSchema>;

const KycForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Fetch existing KYC documents
  const { data: kycDocuments, isLoading } = useQuery({
    queryKey: [`/api/user/${user?.id}/kyc-documents`],
    enabled: !!user?.id
  });
  
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      documentType: "passport",
      documentNumber: "",
      expiryDate: "",
      firstName: user?.fullName.split(" ")[0] || "",
      lastName: user?.fullName.split(" ").slice(1).join(" ") || "",
      dateOfBirth: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    },
  });

  const kycMutation = useMutation({
    mutationFn: (data: any) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 300);
      
      return submitKycDocument(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/kyc-documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      setIsSuccess(true);
      toast({
        title: "KYC submitted successfully",
        description: "Your KYC documents have been submitted for verification. This process usually takes 1-2 business days.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "KYC submission failed",
        description: "There was an error processing your KYC documents. Please try again.",
      });
    },
  });

  const onSubmit = (values: KycFormValues) => {
    if (!user) return;
    
    // Validate that all required images are uploaded
    if (!frontImage || !selfieImage || (values.documentType !== "passport" && !backImage)) {
      toast({
        variant: "destructive",
        title: "Missing document images",
        description: values.documentType === "passport" 
          ? "Please upload both the passport and selfie images" 
          : "Please upload the front, back, and selfie images",
      });
      return;
    }
    
    // In a real implementation, we would upload the images to a server
    // and then submit the KYC data with the image URLs
    // For this demo, we'll just simulate the upload
    
    kycMutation.mutate({
      userId: user.id,
      documentType: values.documentType,
      documentNumber: values.documentNumber,
      expiryDate: values.expiryDate,
      // In a real app, we would include the image URLs and other data
    });
  };

  // Check if KYC is already verified
  const isKycVerified = user?.kycStatus === "verified";
  const isKycPending = user?.kycStatus === "pending";

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'front') setFrontImage(e.target.files[0]);
      else if (type === 'back') setBackImage(e.target.files[0]);
      else setSelfieImage(e.target.files[0]);
    }
  };

  if (isSuccess || isKycVerified || isKycPending) {
    return (
      <Card className={`bg-neutral-900 ${isKycVerified ? "border-success/30" : isKycPending ? "border-yellow-500/30" : "border-primary/30"}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
              isKycVerified 
                ? "bg-success/20 text-success" 
                : isKycPending 
                  ? "bg-yellow-500/20 text-yellow-500" 
                  : "bg-primary/20 text-primary"
            }`}>
              {isKycVerified ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isKycVerified 
                ? "KYC Verification Complete" 
                : isKycPending 
                  ? "KYC Verification Pending" 
                  : "KYC Submission Successful"}
            </h3>
            <p className="text-neutral-400 mb-4">
              {isKycVerified 
                ? "Your identity has been verified. You now have full access to all platform features." 
                : isKycPending 
                  ? "Your KYC documents are being reviewed. This process usually takes 1-2 business days." 
                  : "Your KYC documents have been submitted for verification. This process usually takes 1-2 business days."}
            </p>
            {!isKycVerified && (
              <Button asChild>
                <a href="/">Return to Dashboard</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">KYC Verification</h2>
          <p className="text-neutral-400">Complete your identity verification to unlock all features</p>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-sm">Verification Required</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip/Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Japan">Japan</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="Brazil">Brazil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => setActiveTab("documents")}>
                  Continue to Documents
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of document you want to upload for verification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (if applicable)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 space-x-2 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab("verification")}>
                  Continue to Verification
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <div className="bg-neutral-900 p-4 rounded-lg">
                <h3 className="font-medium mb-4">Document Upload Guidelines</h3>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Ensure all information is clearly visible and not cut off</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Upload in JPEG, PNG, or PDF format, max size 5MB</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Documents must be valid and not expired</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="frontImage">Front of Document</Label>
                  <div className="mt-1 border-2 border-dashed border-neutral-700 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById("frontImage")?.click()}>
                    {frontImage ? (
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{frontImage.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-neutral-400">Click to upload or drag and drop</p>
                        <p className="text-xs text-neutral-500">JPEG, PNG, or PDF (max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="frontImage"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'front')}
                  />
                </div>

                {form.watch("documentType") !== "passport" && (
                  <div>
                    <Label htmlFor="backImage">Back of Document</Label>
                    <div className="mt-1 border-2 border-dashed border-neutral-700 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById("backImage")?.click()}>
                      {backImage ? (
                        <div className="flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{backImage.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-neutral-400">Click to upload or drag and drop</p>
                          <p className="text-xs text-neutral-500">JPEG, PNG, or PDF (max 5MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="backImage"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'back')}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="selfieImage">Selfie with Document</Label>
                  <div className="mt-1 border-2 border-dashed border-neutral-700 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById("selfieImage")?.click()}>
                    {selfieImage ? (
                      <div className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{selfieImage.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-neutral-400">Click to upload or drag and drop</p>
                        <p className="text-xs text-neutral-500">JPEG, PNG (max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="selfieImage"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'selfie')}
                  />
                </div>
              </div>

              {kycMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Uploading documents...</span>
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="pt-4 space-x-2 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("documents")}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={kycMutation.isPending}
                >
                  {kycMutation.isPending ? "Submitting..." : "Submit for Verification"}
                </Button>
              </div>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default KycForm;
