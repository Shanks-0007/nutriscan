import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../backend/firebase';
import { analyzeNutritionLabel, extractProductInfo, NutritionData, getHealthCategory } from '../../backend/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Camera, X, Loader2, AlertCircle, ScanLine } from 'lucide-react';

export const Scan: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.type.startsWith('image/')) {
        setError('Please drop a valid image file');
        return;
      }
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
      setError('');
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file || !auth.currentUser) return;

    try {
      setAnalyzing(true);
      setError('');

      // Fetch user profile for context
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      const base64Image = await fileToBase64(file);
      
      // Step 1: Extract Product Info (Name & Brand)
      const productInfo = await extractProductInfo(base64Image, file.type);
      const normalizedKey = `${productInfo.productName.trim().toLowerCase()}_${productInfo.brand.trim().toLowerCase()}`;

      // Step 2: Check in Global Product Database
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('normalizedKey', '==', normalizedKey),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      let nutritionData: any;
      let insights: any;
      let healthScore: number;
      let category: 'Healthy' | 'Moderate' | 'Risky' | 'Unhealthy';
      let uiLabel: 'Healthy' | 'Occasionally' | 'Risky' | 'Avoid';
      let source: 'Newly Analyzed' | 'Retrieved from Database';
      let productId: string | null = null;
      let productName: string;
      let brandName: string;

      if (!querySnapshot.empty) {
        // Case 1: Product Already Exists
        const productDoc = querySnapshot.docs[0];
        const pData = productDoc.data();
        productId = productDoc.id;
        productName = pData.productName;
        brandName = pData.brandName;
        nutritionData = pData.nutritionData;
        healthScore = pData.healthScore;
        const catInfo = getHealthCategory(healthScore);
        category = catInfo.category;
        uiLabel = catInfo.uiLabel;
        insights = pData.insights;
        source = 'Retrieved from Database';
      } else {
        // Case 2: Product NOT Found (New Product)
        const analysis = await analyzeNutritionLabel(
          base64Image,
          file.type,
          userData?.dietPreference,
          userData?.healthGoal,
          userData
        );
        
        productName = analysis.productName || 'Unknown Product';
        brandName = analysis.brand || 'Unknown Brand';
        healthScore = analysis.healthScore || 0;
        category = analysis.category;
        uiLabel = analysis.uiLabel;
        
        nutritionData = {
          servingSize: analysis.servingSize || 'Unknown',
          calories: typeof analysis.calories === 'number' ? analysis.calories : 0,
          sugar: typeof analysis.sugar === 'number' ? analysis.sugar : 0,
          fat: typeof analysis.fat === 'number' ? analysis.fat : 0,
          saturatedFat: typeof analysis.saturatedFat === 'number' ? analysis.saturatedFat : 0,
          sodium: typeof analysis.sodium === 'number' ? analysis.sodium : 0,
          carbohydrates: typeof analysis.carbohydrates === 'number' ? analysis.carbohydrates : 0,
          fiber: typeof analysis.fiber === 'number' ? analysis.fiber : 0,
          protein: typeof analysis.protein === 'number' ? analysis.protein : 0,
          ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients : [],
          caffeine: analysis.caffeine || 'None'
        };

        insights = {
          positives: Array.isArray(analysis.positives) ? analysis.positives : [],
          negatives: Array.isArray(analysis.negatives) ? analysis.negatives : [],
          recommendation: analysis.recommendation || 'No recommendation available.',
          frequency: analysis.frequency || 'Moderate consumption',
          maxIntake: analysis.maxIntake || 'Not specified',
          recommendedFrequency: analysis.recommendedFrequency || 'Occasionally',
          frequencyReason: analysis.frequencyReason || 'No reason provided.',
          whoShouldBeCareful: Array.isArray(analysis.whoShouldBeCareful) ? analysis.whoShouldBeCareful : [],
          healthierAlternatives: Array.isArray(analysis.healthierAlternatives) ? analysis.healthierAlternatives : []
        };

        source = 'Newly Analyzed';

        // Store in Global Product Database
        const newProduct = {
          productName: String(productName || 'Unknown Product').substring(0, 499),
          brandName: String(brandName || 'Unknown Brand').substring(0, 199),
          normalizedKey,
          nutritionData,
          healthScore,
          category,
          uiLabel,
          insights,
          createdAt: new Date().toISOString()
        };

        try {
          const prodRef = await addDoc(collection(db, 'products'), newProduct);
          productId = prodRef.id;
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'products');
        }
      }

      const historyDoc = {
        productId,
        productName: String(productName).substring(0, 499),
        brandName: String(brandName).substring(0, 199),
        healthScore: Number(healthScore),
        category: String(category),
        uiLabel: String(uiLabel),
        recommendedFrequency: String(insights.recommendedFrequency || 'Occasionally'),
        calories: Number(nutritionData.calories || 0),
        protein: Number(nutritionData.protein || 0),
        sugar: Number(nutritionData.sugar || 0),
        fat: Number(nutritionData.fat || 0),
        scannedAt: new Date().toISOString()
      };

      try {
        const historyRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'history'), historyDoc);
        // Navigate to results
        navigate(`/results/${historyRef.id}?source=${source}&productId=${productId}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/history`);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-heading)] mb-4">
          Scan <span className="neon-text">Nutrition Label</span>
        </h1>
        <p className="text-lg text-[var(--text-color)] font-medium">
          Upload or scan a food label to analyze its nutritional value and health impact using AI.
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm backdrop-blur-md"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative border-2 border-dashed border-[var(--border-color)] rounded-[1.5rem] p-12 text-center hover:bg-black/5 dark:hover:bg-slate-800/30 transition-all duration-300 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem]" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-[var(--btn-secondary)] backdrop-blur-md border border-[var(--border-color)] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:shadow-[0_0_30px_rgba(45,212,191,0.2)] transition-all duration-300 group-hover:-translate-y-2">
                  <UploadCloud className="w-12 h-12 text-teal-500" />
                </div>
                <h3 className="text-2xl font-black text-[var(--text-heading)] mb-3">
                  Click to upload or drag and drop
                </h3>
                <p className="text-[var(--text-muted)] mb-8 font-medium">
                  PNG, JPG or JPEG (max. 5MB)
                </p>
                <button className="relative px-8 py-3.5 btn-primary-cyan rounded-2xl font-black transition-all flex items-center gap-2 mx-auto overflow-hidden group/btn">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Browse Files
                  </span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <button
                onClick={clearSelection}
                disabled={analyzing}
                className="absolute -top-4 -right-4 w-12 h-12 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 shadow-xl z-20 disabled:opacity-50 transition-all hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative rounded-[1.5rem] overflow-hidden border border-[var(--border-color)] bg-[var(--btn-secondary)] backdrop-blur-sm flex items-center justify-center max-h-[500px] p-4 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                <img src={preview} alt="Label preview" className="max-w-full max-h-[460px] object-contain rounded-xl relative z-10 shadow-2xl" />
                
                {analyzing && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 dark:bg-slate-900/40 backdrop-blur-sm rounded-[1.5rem]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-teal-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <span className="text-white dark:text-white font-black tracking-widest uppercase text-sm animate-pulse">Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="relative w-full sm:w-auto px-10 py-4 btn-primary-orange rounded-2xl font-black text-lg overflow-hidden group/btn disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {!analyzing && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />}
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {analyzing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing Data...
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-6 h-6" />
                        Analyze Nutrition Label
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
