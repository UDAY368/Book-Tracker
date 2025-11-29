import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Upload, Loader2, CheckCircle } from 'lucide-react';

interface SignupProps {
  onBack: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBack }) => {
  const [role, setRole] = useState<UserRole>(UserRole.VOLUNTEER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Form Refs for easier FormData extraction
  const formRef = useRef<HTMLFormElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    // Basic Validation
    const formData = new FormData(formRef.current);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Append role explicitly as it's state-controlled
      formData.set('role', role);
      
      // Simulate API Call
      await api.register(formData);
      
      setIsSuccess(true);
      setTimeout(() => {
        onBack();
      }, 3000); // Redirect after 3 seconds
    } catch (error) {
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full animate-in fade-in zoom-in duration-300">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-slate-500 mb-6">
            Your account is pending approval from the Super Admin. You will be notified via email once approved.
          </p>
          <p className="text-sm text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="bg-emerald-700 p-6 flex items-center">
          <button 
            onClick={onBack} 
            type="button"
            className="text-white hover:bg-emerald-600 p-2 rounded-full mr-4 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-emerald-100 text-sm">Join the PSSM Donation Drive</p>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">I am joining as a:</label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
            >
              <option value={UserRole.BOOK_DISTRIBUTOR}>Book Distributor</option>
              <option value={UserRole.INCHARGE}>Incharge (Center/District/Autonomous)</option>
              <option value={UserRole.BOOK_RECEIVER}>Book Receiver</option>
              <option value={UserRole.STAFF}>Staff</option>
              <option value={UserRole.VOLUNTEER}>Volunteer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input name="name" type="text" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">PSSM ID (Optional)</label>
            <input name="pssmId" type="text" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input name="email" type="email" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">WhatsApp Number</label>
            <input name="phone" type="tel" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Address</label>
            <textarea name="address" required rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input name="password" type="password" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <input name="confirmPassword" type="password" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Profile Photo</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden group">
              {photoPreview ? (
                <div className="relative z-10">
                  <img src={photoPreview} alt="Preview" className="h-32 w-32 object-cover rounded-full mx-auto" />
                  <p className="text-xs text-center mt-2 text-slate-500">Click to change</p>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                      <span>Upload a file</span>
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              <input 
                id="file-upload" 
                name="photo" 
                type="file" 
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Processing...
                </>
              ) : (
                'Submit Registration'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Signup;
