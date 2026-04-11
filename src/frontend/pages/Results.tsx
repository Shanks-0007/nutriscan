import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../backend/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Download, Share2, Trash2, ShieldAlert, ShieldCheck, Shield, Activity, Droplets, Flame, Wheat, Beef, Leaf, CheckCircle2, AlertTriangle, Clock, Edit3, Zap, Coffee, ChevronRight, Database, Sparkles, Tag, ListFilter, Lightbulb, Users } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DeleteModal } from '../components/DeleteModal';

export const Results: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchScan = async () => {
      if (!scanId || !auth.currentUser) return;
      try {
        // Step 1: Fetch from User History
        const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', scanId);
        const historySnap = await getDoc(historyRef);
        
        if (historySnap.exists()) {
          const hData = historySnap.data();
          const productId = hData.productId;
          
          // Step 2: Fetch full product data from Global Products
          const productRef = doc(db, 'products', productId);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            const pData = productSnap.data();
            
            // Merge data for display
            const mergedData = {
              id: historySnap.id,
              productId: productId,
              productName: hData.productName, // Use name from history (allows personal renaming)
              brandName: hData.brandName,
              healthScore: hData.healthScore,
              category: hData.category || hData.riskLevel,
              uiLabel: hData.uiLabel || hData.riskLevel,
              scannedAt: hData.scannedAt,
              ...pData.nutritionData,
              ...pData.insights,
              source: new URLSearchParams(window.location.search).get('source') || 'Retrieved from Database'
            };

            setScan(mergedData);
            setNewName(mergedData.productName);
            
            // Animate score
            let start = 0;
            const end = mergedData.healthScore || 0;
            const duration = 1500;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const currentScore = Math.floor(progress * end);
              setAnimatedScore(currentScore);

              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            requestAnimationFrame(animate);
          } else {
            setError('Global product data not found');
          }
        } else {
          setError('Scan history not found or access denied');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${auth.currentUser.uid}/history/${scanId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [scanId]);

  const handleUpdateName = async () => {
    if (!scanId || !newName.trim() || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'history', scanId), { productName: newName });
      setScan({ ...scan, productName: newName });
      setIsEditingName(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}/history/${scanId}`);
    }
  };

  const handleDelete = async () => {
    if (!scanId || !auth.currentUser) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'history', scanId));
      navigate('/history');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/history/${scanId}`);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(20, 184, 166); // Teal
    doc.text('NutriScan Analysis Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 105, 30, { align: 'center' });
    
    // Product Info
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Product Information', 20, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Field', 'Value']],
      body: [
        ['Product Name', scan.productName],
        ['Brand', scan.brand || 'Unknown Brand'],
        ['Serving Size', scan.servingSize],
        ['Health Goal', scan.healthGoal || 'None'],
        ['Preference', scan.consumptionPreference || 'None'],
        ['Health Score', `${scan.healthScore}/100`],
        ['Category', scan.category],
        ['UI Label', scan.uiLabel],
        ['Recommended Frequency', scan.recommendedFrequency || 'Occasionally'],
        ['Scan Date', format(new Date(scan.scannedAt), 'PPP p')],
        ['Source', scan.source || 'Newly Analyzed'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [20, 184, 166] }
    });
    
    // Health Evaluation
    const evalStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Health Evaluation', 20, evalStartY);
    
    doc.setFontSize(11);
    doc.setTextColor(50);
    const splitReason = doc.splitTextToSize(scan.frequencyReason || scan.recommendation || '', 170);
    doc.text(splitReason, 20, evalStartY + 10);

    // Positives & Concerns
    autoTable(doc, {
      startY: evalStartY + 10 + (splitReason.length * 7),
      head: [['Positives', 'Concerns']],
      body: [
        [
          (scan.positives || []).join('\n'),
          (scan.negatives || []).join('\n')
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166] },
      styles: { cellPadding: 5, fontSize: 10 }
    });

    // Who Should Be Careful & Alternatives
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Who Should Be Careful', 'Healthier Alternatives']],
      body: [
        [
          (scan.whoShouldBeCareful || []).join(', '),
          (scan.healthierAlternatives || []).join(', ')
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { cellPadding: 5, fontSize: 10 }
    });
    
    // Nutrition Breakdown
    doc.text('Nutrition Breakdown', 20, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Nutrient', 'Amount', 'Unit']],
      body: [
        ['Calories', scan.calories, 'kcal'],
        ['Sugar', scan.sugar, 'g'],
        ['Fat', scan.fat, 'g'],
        ['Saturated Fat', scan.saturatedFat || 0, 'g'],
        ['Sodium', scan.sodium, 'mg'],
        ['Carbohydrates', scan.carbohydrates, 'g'],
        ['Fiber', scan.fiber || 0, 'g'],
        ['Protein', scan.protein, 'g'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Ingredients
    if (scan.ingredients && scan.ingredients.length > 0) {
      doc.text('Ingredients', 20, (doc as any).lastAutoTable.finalY + 15);
      const ingredientsText = scan.ingredients.join(', ');
      const splitIngredients = doc.splitTextToSize(ingredientsText, 170);
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(splitIngredients, 20, (doc as any).lastAutoTable.finalY + 25);
    }
    
    doc.save(`NutriScan_${scan.productName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `NutriScan Result: ${scan.productName}`,
          text: `Check out the health score for ${scan.productName}: ${scan.healthScore}/100`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-teal-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative z-10">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h2 className="text-3xl font-black text-[var(--text-heading)] mb-3">Result Not Found</h2>
        <p className="text-lg text-[var(--text-color)] mb-8 font-medium">{error || "We couldn't find this scan result."}</p>
        <Link to="/dashboard" className="px-8 py-4 btn-primary-cyan rounded-2xl font-black transition-all">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Healthy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      case 'Moderate': return 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      case 'Risky': return 'text-orange-500 bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
      case 'Unhealthy': return 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const RiskIcon = scan.category === 'Healthy' ? ShieldCheck : scan.category === 'Moderate' ? Shield : ShieldAlert;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-cyan-500 transition-colors font-black group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handleShare} className="p-3 glass-card hover:bg-[var(--btn-secondary)] text-[var(--text-muted)] hover:text-cyan-500 rounded-xl transition-all" title="Share">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={handleDownloadPDF} className="p-3 glass-card hover:bg-[var(--btn-secondary)] text-[var(--text-muted)] hover:text-cyan-500 rounded-xl transition-all" title="Download PDF Report">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="p-3 bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10 transition-all" title="Delete Scan">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />

      <div ref={reportRef} className="space-y-6 print:bg-white print:text-black">
        {/* Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2rem] p-6 md:p-10 shadow-xl flex flex-col md:flex-row items-center md:items-start justify-between gap-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
          
          <div className="flex-1 text-center md:text-left relative z-10">
            {isEditingName ? (
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[var(--btn-secondary)] border border-cyan-500/30 rounded-xl px-4 py-2 text-[var(--text-heading)] text-2xl font-black focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
                <button onClick={handleUpdateName} className="p-2 bg-cyan-500 rounded-xl text-white">
                  <ShieldCheck className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 mb-2 justify-center md:justify-start">
                <h1 className="text-4xl md:text-5xl font-black text-[var(--text-heading)] tracking-tight">
                  {scan.productName === 'Unknown Product' ? (
                    <span className="text-orange-500 italic">Unknown Product</span>
                  ) : scan.productName}
                </h1>
                <button onClick={() => setIsEditingName(true)} className="p-2 text-[var(--text-muted)] hover:text-cyan-500 transition-colors">
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <Tag className="w-4 h-4 text-cyan-500" />
              <span className="text-lg font-black text-[var(--text-muted)]">{scan.brandName || 'Unknown Brand'}</span>
            </div>
            
            {scan.productName === 'Unknown Product' && (
              <p className="text-orange-500 text-sm font-black mb-4 animate-pulse">
                Please enter product name for better analysis
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-6 justify-center md:justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--btn-secondary)] border border-[var(--border-color)] backdrop-blur-sm text-[var(--text-color)] font-black text-xs">
                <Activity className="w-5 h-5 text-cyan-500" />
                Serving Size: {scan.servingSize}
              </div>
              {scan.healthGoal && scan.healthGoal !== 'None' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-sm text-cyan-500 font-black text-[10px] uppercase tracking-wider">
                  Goal: {scan.healthGoal}
                </div>
              )}
              {scan.consumptionPreference && scan.consumptionPreference !== 'None' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/5 border border-purple-500/20 backdrop-blur-sm text-purple-500 font-black text-[10px] uppercase tracking-wider">
                  Pref: {scan.consumptionPreference}
                </div>
              )}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-sm font-black text-[10px] uppercase tracking-wider ${
                scan.source === 'Retrieved from Database' ? 'bg-blue-500/5 border-blue-500/20 text-blue-500' : 'bg-teal-500/5 border-teal-500/20 text-teal-500'
              }`}>
                {scan.source === 'Retrieved from Database' ? <Database className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                {scan.source || 'Newly Analyzed'}
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
              Scanned on {format(new Date(scan.scannedAt), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>

          <div className="flex flex-col items-center shrink-0 relative z-10">
            <div className={`relative w-36 h-36 rounded-full flex items-center justify-center border-[6px] shadow-2xl transition-colors duration-1000 ${
              animatedScore >= 80 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' :
              animatedScore >= 60 ? 'border-amber-500 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' :
              animatedScore >= 40 ? 'border-orange-500 text-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]' :
              'border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
            }`}>
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 rounded-full backdrop-blur-sm" />
              <div className={`absolute inset-0 blur-3xl opacity-20 ${
                animatedScore >= 80 ? 'bg-emerald-500' :
                animatedScore >= 60 ? 'bg-amber-500' :
                animatedScore >= 40 ? 'bg-orange-500' :
                'bg-red-500'
              }`} />
              <span className="relative z-10 text-5xl font-black">{animatedScore}</span>
            </div>
            <div className={`mt-6 px-6 py-2 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md ${getRiskColor(scan.category)}`}>
              <RiskIcon className="w-4 h-4" />
              {scan.uiLabel || scan.category}
            </div>
          </div>
        </motion.div>

        {/* Health Scale Meter */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-[2rem] p-8 shadow-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-amber-500/5 to-emerald-500/5 pointer-events-none" />
          
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-4 relative z-10">
            <div className="flex items-center gap-2 text-red-500">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              High Risk
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Moderate
            </div>
            <div className="flex items-center gap-2 text-emerald-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Healthy
            </div>
          </div>
          
          <div className="h-6 w-full bg-[var(--btn-secondary)] rounded-full overflow-hidden flex border border-[var(--border-color)] p-1 relative z-10">
            <div className="h-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: '40%' }} />
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: '20%' }} />
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400" style={{ width: '20%' }} />
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-r-full" style={{ width: '20%' }} />
          </div>
          
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mt-2 px-1 text-[var(--text-muted)]">
            <span>0</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
          
          <div className="relative mt-4 h-12">
            <motion.div 
              initial={{ left: 0 }}
              animate={{ left: `${scan.healthScore}%` }}
              transition={{ duration: 2, ease: "backOut" }}
              className="absolute -top-10 -translate-x-1/2 flex flex-col items-center z-20"
            >
              <div className="w-1 h-10 bg-[var(--text-heading)] shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.8)] rounded-full" />
              <div className="mt-2 px-3 py-1 bg-[var(--text-heading)] text-[var(--card-bg)] text-[10px] font-black rounded-lg shadow-xl uppercase tracking-wider">
                Current Product
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommended Frequency Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 glass-card rounded-[2rem] p-8 shadow-xl border-l-8 border-cyan-500 bg-gradient-to-br from-cyan-500/5 to-transparent"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-black text-cyan-500 mb-2 flex items-center gap-2">
                  <Clock className="w-6 h-6" /> Recommended Frequency
                </h3>
                <p className="text-[var(--text-color)] text-lg font-medium leading-relaxed">
                  {scan.frequencyReason || scan.recommendation}
                </p>
              </div>
              <div className="shrink-0">
                <div className={`px-8 py-4 rounded-2xl border-2 font-black text-2xl uppercase tracking-widest shadow-2xl ${
                  scan.recommendedFrequency === 'Regular' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-emerald-500/20' :
                  scan.recommendedFrequency === 'Occasionally' ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-amber-500/20' :
                  'bg-red-500/10 border-red-500 text-red-500 shadow-red-500/20'
                }`}>
                  {scan.recommendedFrequency || 'Occasionally'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Positives & Concerns */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-[2rem] p-8 border-2 border-emerald-500/30 bg-emerald-500/5 shadow-lg">
              <h3 className="text-xl font-black text-emerald-500 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" /> ✅ Positives
              </h3>
              <ul className="space-y-4">
                {scan.positives && scan.positives.length > 0 ? (
                  scan.positives.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--text-color)] font-bold">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)] italic">No significant positives detected.</li>
                )}
              </ul>
            </div>

            <div className="glass-card rounded-[2rem] p-8 border-2 border-red-500/30 bg-red-500/5 shadow-lg">
              <h3 className="text-xl font-black text-red-500 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> ⚠️ Concerns
              </h3>
              <ul className="space-y-4">
                {scan.negatives && scan.negatives.length > 0 ? (
                  scan.negatives.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--text-color)] font-bold">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-muted)] italic">No significant concerns detected.</li>
                )}
              </ul>
            </div>
          </motion.div>

          {/* Who Should Be Careful & Alternatives */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-[2rem] p-8 border-2 border-purple-500/30 bg-purple-500/5 shadow-lg">
              <h3 className="text-xl font-black text-purple-500 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6" /> <Users className="w-6 h-6" /> Who Should Be Careful
              </h3>
              <div className="flex flex-wrap gap-3">
                {scan.whoShouldBeCareful && scan.whoShouldBeCareful.length > 0 ? (
                  scan.whoShouldBeCareful.map((group: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {group}
                    </span>
                  ))
                ) : (
                  <p className="text-[var(--text-muted)] italic">No specific groups identified.</p>
                )}
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-8 border-2 border-orange-500/30 bg-orange-500/5 shadow-lg">
              <h3 className="text-xl font-black text-orange-500 mb-6 flex items-center gap-2">
                <Leaf className="w-6 h-6" /> <Lightbulb className="w-6 h-6" /> Healthier Alternatives
              </h3>
              <div className="space-y-4">
                {scan.healthierAlternatives && scan.healthierAlternatives.length > 0 ? (
                  scan.healthierAlternatives.map((alt: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-orange-500/20">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="text-[var(--text-color)] font-bold">{alt}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--text-muted)] italic">No specific alternatives suggested.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ingredients Section */}
        {scan.ingredients && scan.ingredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card rounded-[2rem] p-8 shadow-xl"
          >
            <h3 className="text-xl font-black text-[var(--text-heading)] mb-6 flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-cyan-500" /> Ingredients
            </h3>
            <div className="flex flex-wrap gap-2">
              {scan.ingredients.map((ingredient: string, index: number) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-[var(--btn-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-color)]"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Nutrition Grid */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-[var(--text-heading)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-500" /> Nutritional Breakdown & Scores
          </h3>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            <NutritionCard 
              icon={<Flame className="text-orange-500" />} 
              label="Calories" 
              value={scan.calories} 
              unit="kcal" 
              score={scan.nutrientScores?.calories}
            />
            <NutritionCard 
              icon={<Droplets className="text-blue-500" />} 
              label="Sugar" 
              value={scan.sugar} 
              unit="g" 
              score={scan.nutrientScores?.sugar}
            />
            <NutritionCard 
              icon={<Activity className="text-yellow-500" />} 
              label="Total Fat" 
              value={scan.fat} 
              unit="g" 
              score={scan.nutrientScores?.fat}
            />
            <NutritionCard 
              icon={<Wheat className="text-amber-500" />} 
              label="Sodium" 
              value={scan.sodium} 
              unit="mg" 
              score={scan.nutrientScores?.sodium}
            />
            <NutritionCard 
              icon={<Leaf className="text-emerald-500" />} 
              label="Fiber" 
              value={scan.fiber || 0} 
              unit="g" 
              score={scan.nutrientScores?.fiber}
            />
            <NutritionCard 
              icon={<Beef className="text-indigo-500" />} 
              label="Protein" 
              value={scan.protein} 
              unit="g" 
              score={scan.nutrientScores?.protein}
            />
          </motion.div>
        </div>

        {/* Score Breakdown Explanation */}
        {scan.scoreBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card rounded-[2rem] p-8 shadow-xl border-l-8 border-purple-500 bg-gradient-to-br from-purple-500/5 to-transparent"
          >
            <h3 className="text-xl font-black text-purple-500 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Score Breakdown Logic
            </h3>
            <p className="text-[var(--text-color)] font-medium leading-relaxed">
              {scan.scoreBreakdown}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

interface NutritionCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  score?: number;
}

const NutritionCard: React.FC<NutritionCardProps> = ({ icon, label, value, unit, score }) => (
  <div className="glass-card rounded-3xl p-6 text-center hover:bg-cyan-500/5 transition-all hover:scale-105 group border border-[var(--border-color)] flex flex-col items-center">
    <div className="mb-4 flex justify-center transform group-hover:scale-110 transition-transform">{icon}</div>
    <div className="text-2xl font-black text-[var(--text-heading)] mb-1">{value}</div>
    <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">{label}</div>
    <div className="text-xs text-[var(--text-color)] font-medium mb-3">{unit}</div>
    
    {score !== undefined && (
      <div className="mt-auto w-full pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-black uppercase tracking-tighter text-[var(--text-muted)]">Score</span>
          <span className={`text-[10px] font-black ${
            score >= 80 ? 'text-emerald-500' :
            score >= 60 ? 'text-amber-500' :
            score >= 40 ? 'text-orange-500' :
            'text-red-500'
          }`}>{score}/100</span>
        </div>
        <div className="h-1.5 w-full bg-[var(--btn-secondary)] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              score >= 80 ? 'bg-emerald-500' :
              score >= 60 ? 'bg-amber-500' :
              score >= 40 ? 'bg-orange-500' :
              'bg-red-500'
            }`} 
            style={{ width: `${score}%` }} 
          />
        </div>
      </div>
    )}
  </div>
);
