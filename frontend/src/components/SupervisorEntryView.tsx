import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Camera,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  Radio,
  FileCode,
  Eye,
  Check,
  Zap,
  Info,
  Scan,
  X,
  RefreshCw,
  Tag,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  Globe
} from 'lucide-react';
import { SAMPLE_EVIDENCE_IMAGES } from '../utils/sampleImages';
import { runLocalOCR, calculateImageFingerprint, normalizeEquipmentTag, OCRScanResult } from '../utils/ocrService';
import { speechService, SAMPLE_VOICE_PRESETS, SpeechLanguage, VoicePreset } from '../utils/speechService';
import { parseSpokenUpdate } from '../utils/speechParser';
import { SpokenParseResult } from '../types';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SupervisorEntryView: React.FC = () => {
  const {
    handleAddNewFieldEntry,
    handleCustomUpload,
    siteUpdates,
    matchResults,
    setSelectedInspectorUpdateId,
    setActiveTab,
    offlineMode,
    addToast,
  } = useProject();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'quick-report' | 'file-upload' | 'photo-proof'>('quick-report');

  // Form State
  const [discipline, setDiscipline] = useState('Piping');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [area, setArea] = useState('Pump Bay');
  const [eventStatus, setEventStatus] = useState<'Started' | 'Completed' | 'In Progress'>('Completed');
  const [quantity, setQuantity] = useState('100%');
  const [supervisorName, setSupervisorName] = useState('R. Sharma (Lead Piping Supv)');

  // Voice Dictation State
  const [showVoiceCard, setShowVoiceCard] = useState<boolean>(true);
  const [voiceLang, setVoiceLang] = useState<SpeechLanguage>('en-IN');
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [interimVoiceText, setInterimVoiceText] = useState<string>('');
  const [parsedVoiceResult, setParsedVoiceResult] = useState<SpokenParseResult | null>(null);
  const [voiceErrorMsg, setVoiceErrorMsg] = useState<string | null>(null);

  // Photo Evidence State
  const [imagePreview, setImagePreview] = useState<string | null>(SAMPLE_EVIDENCE_IMAGES.pipeWeld);
  const [imageFilename, setImageFilename] = useState<string>('PHOTO_CW_017_WELD_QA.jpg');
  const [imageFileSize, setImageFileSize] = useState<number>(2450890);
  const [imageFingerprint, setImageFingerprint] = useState<string>('a7c3f910e52b89d412c091ea28f73b6490e21bc08192a543881efac99d428901');
  const [imageType, setImageType] = useState<'completion' | 'issue' | 'progress'>('completion');
  const [imageCaption, setImageCaption] = useState('Visual inspection verified for pipe joint erection');

  // OCR Scan State
  const [isScanningOCR, setIsScanningOCR] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<OCRScanResult | null>({
    rawText: 'LINE 24-CW-017 SPOOL WELD SEAM #03 NDT CLEARED PUMP BAY',
    detectedTags: ['24-CW-017', 'CW-017'],
    ocrConfidence: 94,
    status: 'success',
  });
  const [showRawOCR, setShowRawOCR] = useState<boolean>(false);

  // Human Tag Confirmation State
  const [manualTagInput, setManualTagInput] = useState<string>('24-CW-017');
  const [confirmedTag, setConfirmedTag] = useState<string>('24-CW-017');

  // Issue Blocker State
  const [isIssueReport, setIsIssueReport] = useState(false);
  const [issueFlag, setIssueFlag] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'critical'>('medium');

  // Submit Feedback
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // File Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchCsvRef = useRef<HTMLInputElement>(null);

  // Voice Recording Toggle
  const handleToggleVoiceRecording = (lang: SpeechLanguage = voiceLang) => {
    if (isVoiceRecording) {
      speechService.stop();
      setIsVoiceRecording(false);
      return;
    }

    setVoiceErrorMsg(null);
    setVoiceTranscript('');
    setInterimVoiceText('');
    setParsedVoiceResult(null);

    const started = speechService.start(lang, {
      onInterimTranscript: text => {
        setInterimVoiceText(text);
        const parsed = parseSpokenUpdate(text, lang);
        setParsedVoiceResult(parsed);
      },
      onFinalTranscript: text => {
        setVoiceTranscript(prev => (prev ? `${prev} ${text}` : text));
        setInterimVoiceText('');
        const full = voiceTranscript ? `${voiceTranscript} ${text}` : text;
        const parsed = parseSpokenUpdate(full, lang);
        setParsedVoiceResult(parsed);
      },
      onStateChange: state => {
        setIsVoiceRecording(state === 'listening');
      },
      onError: err => {
        setVoiceErrorMsg(err);
        setIsVoiceRecording(false);
      },
    });

    if (!started) {
      setIsVoiceRecording(false);
    }
  };

  const handleSelectVoicePreset = (preset: VoicePreset) => {
    speechService.stop();
    setIsVoiceRecording(false);
    setVoiceLang(preset.language);
    setVoiceTranscript(preset.transcript);
    setInterimVoiceText('');
    setVoiceErrorMsg(null);

    const parsed = parseSpokenUpdate(preset.transcript, preset.language);
    setParsedVoiceResult(parsed);

    addToast({
      type: 'info',
      title: `Voice Preset Loaded (${preset.langLabel})`,
      message: `Spoken log loaded: "${preset.transcript}".`,
    });
  };

  const handleApplyVoiceToForm = () => {
    if (!parsedVoiceResult) return;

    setDiscipline(parsedVoiceResult.discipline);
    setArea(parsedVoiceResult.area);
    setEventStatus(parsedVoiceResult.eventStatus);
    if (parsedVoiceResult.quantity) setQuantity(parsedVoiceResult.quantity);
    if (parsedVoiceResult.detectedTag) {
      setConfirmedTag(parsedVoiceResult.detectedTag);
      setManualTagInput(parsedVoiceResult.detectedTag);
    }
    setDescription(parsedVoiceResult.cleanDescription);
    setRawText(`[VOICE LOG (${parsedVoiceResult.language})]: ${parsedVoiceResult.rawTranscript}`);

    if (parsedVoiceResult.issueFlag) {
      setIsIssueReport(true);
      setIssueFlag(parsedVoiceResult.issueFlag);
      setIssueSeverity(parsedVoiceResult.issueSeverity || 'medium');
    }

    addToast({
      type: 'success',
      title: 'Spoken Fields Applied to Form',
      message: `Set ${parsedVoiceResult.discipline} • ${parsedVoiceResult.area}${parsedVoiceResult.detectedTag ? ` • Tag [${parsedVoiceResult.detectedTag}]` : ''}.`,
    });
  };

  // Process File Selection & Validation
  const processImageFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      addToast({
        type: 'error',
        title: 'Unsupported File Format',
        message: `File format "${file.type || file.name.split('.').pop()}" is not supported. Please upload JPEG, PNG, or WebP.`,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      addToast({
        type: 'error',
        title: 'File Size Limit Exceeded',
        message: `File size is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed limit is 8 MB.`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async event => {
      const dataUrl = event.target?.result as string;
      const hash = await calculateImageFingerprint(file);
      setImagePreview(dataUrl);
      setImageFilename(file.name);
      setImageFileSize(file.size);
      setImageFingerprint(hash);
      setOcrResult(null);
      setConfirmedTag('');
      setManualTagInput('');
      addToast({
        type: 'info',
        title: 'Photo Evidence Attached',
        message: `Attached "${file.name}" (${(file.size / 1024).toFixed(0)} KB). Ready for OCR Tag Scan.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // Run Local OCR Scan on Demand
  const handleRunOCR = async () => {
    if (!imagePreview) {
      addToast({
        type: 'warning',
        title: 'No Image Attached',
        message: 'Please attach a photo before running OCR tag scan.',
      });
      return;
    }

    setIsScanningOCR(true);
    addToast({
      type: 'info',
      title: 'OCR Scan Started',
      message: 'Analyzing photo locally for construction & equipment tags...',
    });

    try {
      const res = await runLocalOCR(imagePreview);
      setOcrResult(res);

      if (res.detectedTags.length > 0) {
        // Pre-fill first detected candidate
        setManualTagInput(res.detectedTags[0]);
        addToast({
          type: 'success',
          title: 'OCR Scan Complete',
          message: `Detected ${res.detectedTags.length} candidate tag(s): ${res.detectedTags.join(', ')} (OCR Confidence: ${res.ocrConfidence}%).`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'No Confident Tag Detected',
          message: 'No equipment tag was confidently detected. Please enter or confirm a tag manually.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'OCR Scan Error',
        message: 'Could not process image text. You can still enter equipment tags manually.',
      });
    } finally {
      setIsScanningOCR(false);
    }
  };

  // Human Tag Confirmation Handler
  const handleConfirmTag = (tagToConfirm: string) => {
    const norm = normalizeEquipmentTag(tagToConfirm);
    if (!norm) {
      addToast({
        type: 'warning',
        title: 'Invalid Tag Format',
        message: 'Please enter a valid equipment tag (e.g. 24-CW-017).',
      });
      return;
    }
    setConfirmedTag(norm);
    setManualTagInput(norm);
    addToast({
      type: 'success',
      title: 'Tag Confirmed by Supervisor',
      message: `Confirmed tag "${norm}" as matching evidence.`,
    });
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    setImageFilename('');
    setImageFileSize(0);
    setImageFingerprint('');
    setOcrResult(null);
    setConfirmedTag('');
    setManualTagInput('');
    addToast({
      type: 'info',
      title: 'Photo Evidence Detached',
      message: 'Cleared attached image and OCR evidence.',
    });
  };

  // Submit field entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast({
        type: 'warning',
        title: 'Description Required',
        message: 'Please provide a formal activity description before submitting.',
      });
      return;
    }

    await handleAddNewFieldEntry({
      discipline,
      description,
      rawText: rawText || description,
      area,
      eventStatus,
      quantity,
      supervisor: supervisorName,
      imageFile: imagePreview || undefined,
      imageType,
      caption: imageCaption,
      filename: imageFilename || undefined,
      fileSize: imageFileSize || undefined,
      sha256Hash: imageFingerprint || undefined,
      ocrStatus: ocrResult ? ocrResult.status : undefined,
      ocrConfidence: ocrResult ? ocrResult.ocrConfidence : undefined,
      ocrRawText: ocrResult ? ocrResult.rawText : undefined,
      ocrDetectedTags: ocrResult ? ocrResult.detectedTags : undefined,
      confirmedTag: confirmedTag || undefined,
      confirmedBy: confirmedTag ? 'supervisor' : 'unconfirmed',
      issueFlag: isIssueReport ? issueFlag : undefined,
      issueSeverity: isIssueReport ? issueSeverity : undefined,
    });

    setSubmitSuccess(`Progress entry submitted & processed with AI multi-factor matching!`);
    setDescription('');
    setRawText('');
    setQuantity('100%');
    if (isIssueReport) setIssueFlag('');

    setTimeout(() => {
      setSubmitSuccess(null);
    }, 4000);
  };

  // Quick preset loader for supervisors
  const applyQuickTemplate = (preset: {
    disp: string;
    area: string;
    desc: string;
    raw: string;
    status: 'Started' | 'Completed' | 'In Progress';
    img: string;
    imgType: 'completion' | 'issue' | 'progress';
    caption: string;
    tag: string;
    detectedTags: string[];
    filename: string;
    issue?: { flag: string; severity: 'low' | 'medium' | 'critical' };
  }) => {
    setDiscipline(preset.disp);
    setArea(preset.area);
    setDescription(preset.desc);
    setRawText(preset.raw);
    setEventStatus(preset.status);
    setImagePreview(preset.img);
    setImageType(preset.imgType);
    setImageCaption(preset.caption);
    setImageFilename(preset.filename);
    setImageFileSize(2450890);
    setImageFingerprint('a7c3f910e52b89d412c091ea28f73b6490e21bc08192a543881efac99d428901');
    setOcrResult({
      rawText: `VERIFIED TAG: ${preset.tag} INSPECTION CLEARED`,
      detectedTags: preset.detectedTags,
      ocrConfidence: 94,
      status: 'success',
    });
    setConfirmedTag(preset.tag);
    setManualTagInput(preset.tag);

    if (preset.issue) {
      setIsIssueReport(true);
      setIssueFlag(preset.issue.flag);
      setIssueSeverity(preset.issue.severity);
    } else {
      setIsIssueReport(false);
      setIssueFlag('');
    }

    addToast({
      type: 'info',
      title: 'Template Applied',
      message: `Loaded template for ${preset.disp} (${preset.tag}).`,
    });
  };

  // Batch file processing trigger
  const handleBatchFileDrop = async (file: File) => {
    const isXlsx = file.name.endsWith('.xlsx');

    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        await handleCustomUpload({ pipingProgressXlsx: buffer });
        setSubmitSuccess(`Excel file "${file.name}" parsed and ingested into Datum engine!`);
        setTimeout(() => setSubmitSuccess(null), 4000);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        await handleCustomUpload({ dailyReportTxt: content });
        setSubmitSuccess(`File "${file.name}" parsed and ingested into Datum engine!`);
        setTimeout(() => setSubmitSuccess(null), 4000);
      };
      reader.readAsText(file);
    }
  };

  const recentSubmissions = siteUpdates.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Header */}
      <div className="banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="brand-badge" style={{ background: '#f0f7fc', color: '#0284c7', borderColor: '#bae6fd' }}>
              Field Supervisor Hub
            </span>
            <span className="mono-pill" style={{ background: '#f8fafc', color: 'var(--text-muted)' }}>
              OCR-Assisted Evidence Verification
            </span>
            {offlineMode && (
              <span className="mono-pill" style={{ background: '#fff4e5', color: '#974f0c', borderColor: '#fec195', fontWeight: 700 }}>
                ⚡ Offline Queue Active
              </span>
            )}
          </div>
          <h1 className="banner-title">
            <Camera size={22} style={{ color: 'var(--brand-primary)' }} />
            <span>Site Progress & Photo Evidence Verification</span>
          </h1>
          <p className="banner-desc">
            Submit daily progress reports, attach photo proof with on-demand local OCR tag extraction, and verify equipment tags for schedule matching.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('site-updates')}
            type="button"
          >
            <span>View Full Feed</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {submitSuccess && (
        <div
          style={{
            background: 'var(--status-ready-bg)',
            border: '1px solid var(--status-ready-border)',
            color: 'var(--status-ready-fg)',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* 3-Tab Mode Navigation Pill */}
      <div
        style={{
          display: 'flex',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '5px',
          gap: '6px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('quick-report')}
          className="btn"
          style={{
            flex: 1,
            background: activeSubTab === 'quick-report' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'quick-report' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'quick-report' ? 700 : 600,
            fontSize: '0.875rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeSubTab === 'quick-report' ? '0 1px 3px rgba(2, 132, 199, 0.3)' : 'none',
          }}
        >
          <FileText size={16} />
          <span>1. Direct Daily Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('photo-proof')}
          className="btn"
          style={{
            flex: 1,
            background: activeSubTab === 'photo-proof' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'photo-proof' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'photo-proof' ? 700 : 600,
            fontSize: '0.875rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeSubTab === 'photo-proof' ? '0 1px 3px rgba(2, 132, 199, 0.3)' : 'none',
          }}
        >
          <Camera size={16} />
          <span>2. Photo Evidence & OCR Tag Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('file-upload')}
          className="btn"
          style={{
            flex: 1,
            background: activeSubTab === 'file-upload' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'file-upload' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'file-upload' ? 700 : 600,
            fontSize: '0.875rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeSubTab === 'file-upload' ? '0 1px 3px rgba(2, 132, 199, 0.3)' : 'none',
          }}
        >
          <FileSpreadsheet size={16} />
          <span>3. Batch Spreadsheet & TXT Upload</span>
        </button>
      </div>

      {/* Main Form Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(330px, 1fr)', gap: '1.5rem' }}>
        
        {/* Left Column: Interactive Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB 1: DIRECT REPORT & FORM */}
          {(activeSubTab === 'quick-report' || activeSubTab === 'photo-proof') && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    {activeSubTab === 'quick-report' ? (
                      <>
                        <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                        <span>Log Field Execution Event</span>
                      </>
                    ) : (
                      <>
                        <Scan size={18} style={{ color: 'var(--brand-primary)' }} />
                        <span>Photo Evidence & OCR-Assisted Verification</span>
                      </>
                    )}
                  </h3>
                  <div className="card-desc">
                    Attach visual proof, extract OCR candidate tags on demand, and confirm equipment tag evidence.
                  </div>
                </div>
              </div>

              <div className="card-body">
                {/* Multilingual Voice Dictation Assistant (Web Speech API) */}
                <div
                  style={{
                    marginBottom: '1.25rem',
                    background: isVoiceRecording ? '#f0f9ff' : '#f8fafc',
                    padding: '1rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    border: isVoiceRecording ? '2px solid var(--brand-primary)' : '1px solid #bae6fd',
                    boxShadow: isVoiceRecording ? '0 0 15px rgba(2, 132, 199, 0.2)' : 'none',
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          background: isVoiceRecording ? '#ef4444' : 'var(--brand-primary)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Mic size={13} />
                        <span>{isVoiceRecording ? 'RECORDING LIVE' : 'VOICE DICTATION'}</span>
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Native Multilingual Speech-to-Field Dictation
                      </span>
                    </div>

                    {/* Language Selector Chips */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(
                        [
                          { id: 'en-IN', label: 'English (IN)' },
                          { id: 'hi-IN', label: 'हिन्दी (Hindi)' },
                          { id: 'ta-IN', label: 'தமிழ் (Tamil)' },
                        ] as const
                      ).map(l => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            setVoiceLang(l.id);
                            if (isVoiceRecording) {
                              handleToggleVoiceRecording(l.id);
                            }
                          }}
                          style={{
                            background: voiceLang === l.id ? 'var(--brand-primary)' : '#ffffff',
                            color: voiceLang === l.id ? '#ffffff' : 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Speech Interaction Area */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                    {/* Big Pulsing Mic Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleVoiceRecording(voiceLang)}
                      className="btn"
                      style={{
                        background: isVoiceRecording ? '#dc2626' : 'var(--brand-primary)',
                        color: '#ffffff',
                        padding: '0.6rem 1.1rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: isVoiceRecording ? '0 0 12px rgba(220, 38, 38, 0.5)' : 'none',
                        cursor: 'pointer',
                      }}
                      title="Click to start/stop live microphone dictation"
                    >
                      {isVoiceRecording ? <MicOff size={16} /> : <Mic size={16} />}
                      <span>{isVoiceRecording ? 'Stop Recording' : 'Tap to Speak'}</span>
                    </button>

                    {/* Status Feedback & Audio Waveform Simulator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                      {isVoiceRecording ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
                            Listening in {voiceLang === 'en-IN' ? 'Indian English' : voiceLang === 'hi-IN' ? 'Hindi' : 'Tamil'}...
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 6 }}>
                            <span style={{ width: 3, height: 14, background: '#0284c7', borderRadius: 2, animation: 'pulse 0.6s infinite alternate' }} />
                            <span style={{ width: 3, height: 22, background: '#0284c7', borderRadius: 2, animation: 'pulse 0.4s infinite alternate' }} />
                            <span style={{ width: 3, height: 10, background: '#0284c7', borderRadius: 2, animation: 'pulse 0.7s infinite alternate' }} />
                            <span style={{ width: 3, height: 18, background: '#0284c7', borderRadius: 2, animation: 'pulse 0.5s infinite alternate' }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Speak naturally or select a test scenario below to automatically structure fields.
                        </span>
                      )}
                    </div>

                    {/* Apply Button (Visible when transcript is ready) */}
                    {parsedVoiceResult && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ background: '#059669', borderColor: '#047857', fontWeight: 700, fontSize: '0.775rem' }}
                        onClick={handleApplyVoiceToForm}
                      >
                        <Check size={14} />
                        <span>Apply Spoken Fields to Form</span>
                      </button>
                    )}
                  </div>

                  {/* Error Notification if mic is blocked */}
                  {voiceErrorMsg && (
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#fef2f2',
                        border: '1px solid #fecdd3',
                        color: '#991b1b',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.725rem',
                        marginBottom: '0.65rem',
                        lineHeight: 1.35,
                      }}
                    >
                      <strong>Speech Notice:</strong> {voiceErrorMsg}
                    </div>
                  )}

                  {/* Live Streaming Transcript Box */}
                  {(voiceTranscript || interimVoiceText) && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '0.6rem 0.85rem',
                        marginBottom: '0.65rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                      }}
                    >
                      <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                        SPOKEN DICTATION TRANSCRIPT:
                      </div>
                      <span>{voiceTranscript}</span>
                      {interimVoiceText && <span style={{ color: 'var(--brand-primary)', fontStyle: 'italic' }}> {interimVoiceText}...</span>}
                    </div>
                  )}

                  {/* Real-Time Parsed Entity Chips */}
                  {parsedVoiceResult && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #bae6fd',
                        borderRadius: 'var(--radius-xs)',
                        padding: '0.6rem 0.85rem',
                        marginBottom: '0.65rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                          ✓ AI Structured Intent Extraction:
                        </span>
                        <span className="mono-pill" style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                          {parsedVoiceResult.confidenceScore}% Confidence
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 2 }}>
                        <span className="mono-pill" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                          Trade: <strong>{parsedVoiceResult.discipline}</strong>
                        </span>
                        <span className="mono-pill" style={{ background: '#f8fafc', color: 'var(--text-secondary)' }}>
                          Area: <strong>{parsedVoiceResult.area}</strong>
                        </span>
                        {parsedVoiceResult.detectedTag && (
                          <span className="mono-pill" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', fontWeight: 800 }}>
                            Tag: <strong>{parsedVoiceResult.detectedTag}</strong>
                          </span>
                        )}
                        <span className="mono-pill" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                          Status: <strong>{parsedVoiceResult.eventStatus}</strong>
                        </span>
                        {parsedVoiceResult.quantity && (
                          <span className="mono-pill" style={{ background: '#f3f0ff', color: '#6e5dc6', borderColor: '#d3cbfb' }}>
                            Qty: <strong>{parsedVoiceResult.quantity}</strong>
                          </span>
                        )}
                        {parsedVoiceResult.issueFlag && (
                          <span className="mono-pill" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fecdd3', fontWeight: 700 }}>
                            Blocker: {parsedVoiceResult.issueFlag}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 1-Click Voice Presets (for instant evaluation in Opera/Firefox/offline) */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Quick Voice Scenarios (1-Click Test for Opera / Quiet Environments):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {SAMPLE_VOICE_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectVoicePreset(preset)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-subtle)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.725rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={preset.transcript}
                        >
                          <Volume2 size={12} style={{ color: 'var(--brand-primary)' }} />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1-Click Field Scenarios Toolbar */}
                <div
                  style={{
                    marginBottom: '1.25rem',
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Zap size={13} style={{ color: 'var(--brand-primary)' }} />
                    Quick Field Scenarios (1-Click Sample Fill):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() =>
                        applyQuickTemplate({
                          disp: 'Piping',
                          area: 'Pump Bay',
                          desc: 'Erected 24-inch cooling water line spool Line 24-CW-017 in Pump Bay with full penetration weld clearance.',
                          raw: 'Line 24-CW-017 spool erected in pump bay NDT test cleared 100% finished',
                          status: 'Completed',
                          img: SAMPLE_EVIDENCE_IMAGES.pipeWeld,
                          imgType: 'completion',
                          caption: 'Visual QA Inspection: Weld seam 24-CW-017 completed with full penetration.',
                          tag: '24-CW-017',
                          detectedTags: ['24-CW-017', 'CW-017'],
                          filename: 'PHOTO_CW_017_WELD_QA.jpg',
                        })
                      }
                    >
                      <span>CW-017 Pipe Erection</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() =>
                        applyQuickTemplate({
                          disp: 'Civil',
                          area: 'Pump Bay',
                          desc: 'Concreting of cooling water pump foundation raft completed. Curing checklist initiated.',
                          raw: 'Pump foundation concrete pour finished slump test verified M35 mix',
                          status: 'Completed',
                          img: SAMPLE_EVIDENCE_IMAGES.pumpFoundation,
                          imgType: 'completion',
                          caption: 'Concrete Pour & Curing Checklist Verified for Pump Foundation.',
                          tag: 'CIV-L6-002',
                          detectedTags: ['CIV-L6-002', 'PUMP-FDN'],
                          filename: 'CIV_FDN_CONCRETE_POUR_04.jpg',
                        })
                      }
                    >
                      <span>Pump Bay Concreting</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() =>
                        applyQuickTemplate({
                          disp: 'Electrical',
                          area: 'Switchgear Rm',
                          desc: 'Pulling 415V switchgear feeder cable through tier-2 tray to MCC-415V in progress.',
                          raw: 'Cable pull in progress tier 2 tray 415V switchgear to MCC 450m pulled',
                          status: 'In Progress',
                          img: SAMPLE_EVIDENCE_IMAGES.cableTray,
                          imgType: 'progress',
                          caption: '415V Switchgear feeder cable pull in progress.',
                          tag: 'MCC-415V',
                          detectedTags: ['MCC-415V', 'ELE-L6-021'],
                          filename: 'ELE_TRAY_PULL_SWG01.jpg',
                        })
                      }
                    >
                      <span>MCC-415V Cable Pull</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Row 1: Discipline, Work Area, Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Discipline</label>
                      <select
                        className="form-select"
                        value={discipline}
                        onChange={e => setDiscipline(e.target.value)}
                      >
                        <option value="Piping">Piping</option>
                        <option value="Civil">Civil</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Instrumentation">Instrumentation</option>
                        <option value="HSE">HSE</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Work Area / Front</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Pump Bay, Substation, Pipe Rack"
                        value={area}
                        onChange={e => setArea(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Event Status</label>
                      <select
                        className="form-select"
                        value={eventStatus}
                        onChange={e => setEventStatus(e.target.value as any)}
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Started">Started</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Formal Description & Verbatim Text */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Formal Activity Description</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Core input for NLP matching</span>
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="e.g. Hydrostatic testing of 8in cooling water line completed at Pump Bay."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span>Raw Field Log Text</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preserves original site note verbatim</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Line 24-CW-017 spool erected in pump bay NDT cleared"
                      value={rawText}
                      onChange={e => setRawText(e.target.value)}
                    />
                  </div>

                  {/* PHOTO EVIDENCE & OCR ATTACHMENT STUDIO SECTION */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Camera size={18} style={{ color: 'var(--brand-primary)' }} />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          Construction Photo Evidence & OCR Tag Verification
                        </span>
                      </div>
                      <span className="mono-pill">JPEG, PNG, WebP &bull; Max 8 MB</span>
                    </div>

                    {/* Drag-and-Drop / File Selector Zone */}
                    {!imagePreview ? (
                      <div
                        style={{
                          border: '2px dashed var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.75rem 1rem',
                          textAlign: 'center',
                          background: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) {
                            processImageFile(e.dataTransfer.files[0]);
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'var(--brand-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--brand-primary)',
                          }}
                        >
                          <UploadCloud size={24} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          Click to Attach Construction Photo or Drag & Drop Here
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Attach site progress photo, weld seam inspection, or equipment nameplate
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".jpg,.jpeg,.png,.webp"
                          style={{ display: 'none' }}
                          onChange={handleCustomImageUpload}
                        />
                      </div>
                    ) : (
                      /* Attached Image Preview & OCR Operations */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '130px minmax(0, 1fr)',
                            gap: '1rem',
                            background: '#ffffff',
                            padding: '0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <img
                            src={imagePreview}
                            alt="Attached Evidence"
                            style={{
                              width: '130px',
                              height: '95px',
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          />

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {imageFilename || 'Attached Photo'}
                                </div>
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                  Size: {(imageFileSize / 1024).toFixed(0)} KB &bull; Type: {imageType.toUpperCase()}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  Replace
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#b91c1c' }}
                                  onClick={handleRemovePhoto}
                                  title="Remove attached photo"
                                >
                                  <X size={12} />
                                </button>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  accept=".jpg,.jpeg,.png,.webp"
                                  style={{ display: 'none' }}
                                  onChange={handleCustomImageUpload}
                                />
                              </div>
                            </div>

                            {/* Integrity Fingerprint Badge */}
                            {imageFingerprint && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
                                <ShieldCheck size={12} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                                <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  SHA-256 Fingerprint: {imageFingerprint.slice(0, 20)}...
                                </span>
                              </div>
                            )}

                            {/* On-Demand OCR Action Button */}
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.775rem' }}
                                onClick={handleRunOCR}
                                disabled={isScanningOCR}
                              >
                                {isScanningOCR ? (
                                  <>
                                    <RefreshCw size={13} className="spin" />
                                    <span>Scanning Photo with Local OCR...</span>
                                  </>
                                ) : (
                                  <>
                                    <Scan size={13} />
                                    <span>Run OCR Tag Scan</span>
                                  </>
                                )}
                              </button>

                              {ocrResult && (
                                <span className="mono-pill" style={{ fontSize: '0.675rem' }}>
                                  OCR Confidence: <strong>{ocrResult.ocrConfidence}%</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* OCR Detected Candidates & Confirmation Card */}
                        {ocrResult && (
                          <div
                            style={{
                              background: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Candidate Equipment Tags Detected:
                              </span>
                              {ocrResult.rawText && (
                                <button
                                  type="button"
                                  onClick={() => setShowRawOCR(!showRawOCR)}
                                  style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.725rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                                >
                                  <span>{showRawOCR ? 'Hide' : 'View'} Raw OCR Text</span>
                                  {showRawOCR ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              )}
                            </div>

                            {/* Raw OCR Text Collapsible Dropdown */}
                            {showRawOCR && ocrResult.rawText && (
                              <div className="raw-code-box" style={{ fontSize: '0.725rem', padding: '0.5rem' }}>
                                {ocrResult.rawText}
                              </div>
                            )}

                            {/* Candidate Tag Selectable Chips */}
                            {ocrResult.detectedTags.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                                {ocrResult.detectedTags.map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleConfirmTag(tag)}
                                    className={`btn btn-sm ${confirmedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ fontSize: '0.775rem', padding: '3px 8px', fontFamily: 'var(--font-mono)' }}
                                  >
                                    <Tag size={12} />
                                    <span>{tag}</span>
                                    {confirmedTag === tag && <Check size={12} style={{ marginLeft: 3 }} />}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No equipment tag was confidently detected. Enter or confirm a tag manually below.
                              </div>
                            )}

                            {/* Human Tag Confirmation & Correction Input */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: 4 }}>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                                  placeholder="Type or correct equipment tag (e.g. 24-CW-017)..."
                                  value={manualTagInput}
                                  onChange={e => setManualTagInput(e.target.value)}
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleConfirmTag(manualTagInput)}
                              >
                                <span>Confirm Tag</span>
                              </button>
                            </div>

                            {/* Confirmed Tag Status Banner */}
                            {confirmedTag ? (
                              <div
                                style={{
                                  background: 'var(--status-ready-bg)',
                                  border: '1px solid var(--status-ready-border)',
                                  color: 'var(--status-ready-fg)',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: 'var(--radius-xs)',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <CheckCircle2 size={14} />
                                <span>
                                  Confirmed tag <strong>{confirmedTag}</strong> will be considered as matching evidence. It will not automatically approve the schedule link.
                                </span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                Status: <strong>No tag confirmed</strong>. Human confirmation is required to strengthen schedule matching.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Blocker / Issue Toggle Card */}
                  <div
                    style={{
                      background: isIssueReport ? '#fff5f5' : '#f8fafc',
                      border: `1px solid ${isIssueReport ? '#fca5a5' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <AlertOctagon size={18} style={{ color: isIssueReport ? '#dc2626' : 'var(--text-muted)' }} />
                        <div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isIssueReport ? '#dc2626' : 'var(--text-primary)' }}>
                            Flag as Site Blocker / Delay Issue
                          </span>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            Instantly alerts project planners and flags critical path risk
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isIssueReport}
                        onChange={e => setIsIssueReport(e.target.checked)}
                        style={{ cursor: 'pointer', width: 18, height: 18 }}
                      />
                    </div>

                    {isIssueReport && (
                      <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Describe blocker reason (e.g. 50T crane breakdown, access road blocked, missing parts)"
                          value={issueFlag}
                          onChange={e => setIssueFlag(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#dc2626' }}>Severity:</span>
                          {(['low', 'medium', 'critical'] as const).map(sev => (
                            <button
                              type="button"
                              key={sev}
                              onClick={() => setIssueSeverity(sev)}
                              className="btn btn-sm"
                              style={{
                                textTransform: 'capitalize',
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.75rem',
                                background: issueSeverity === sev ? '#dc2626' : '#ffffff',
                                color: issueSeverity === sev ? '#ffffff' : '#dc2626',
                                borderColor: '#fca5a5',
                                fontWeight: 700,
                              }}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.25rem', fontSize: '0.925rem', fontWeight: 700, justifyContent: 'center' }}
                  >
                    <Send size={16} />
                    <span>Submit & Run AI Match Reconciliation</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: FILE UPLOAD (CSV, XLSX, TXT) */}
          {activeSubTab === 'file-upload' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <FileSpreadsheet size={18} style={{ color: 'var(--brand-primary)' }} />
                    Batch Spreadsheet & Text File Ingestion
                  </h3>
                  <div className="card-desc">
                    Upload daily field logs in CSV, Excel XLSX, or plain text format. Datum parses any format automatically.
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div
                  style={{
                    border: '2px dashed var(--brand-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => batchCsvRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleBatchFileDrop(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'var(--brand-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-primary)',
                    }}
                  >
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      Drag & Drop CSV / XLSX / TXT Log Files Here
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Supports Daily Reports (.txt), Piping Progress (.xlsx), and Site Logs (.csv)
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={batchCsvRef}
                    accept=".csv,.txt,.xlsx"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files?.[0]) handleBatchFileDrop(e.target.files[0]);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Stream & Matching Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Matching Intelligence Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title">
                  <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
                  Deterministic Evidence Standards
                </h4>
                <div className="card-desc">Explainable matching and photo provenance.</div>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                <CheckCircle2 size={16} style={{ color: '#047857', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>OCR Tag Evidence:</strong> Extracted tags (e.g. <code>24-CW-017</code>) provide verified keyword match points upon human confirmation.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                <CheckCircle2 size={16} style={{ color: '#047857', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Mandatory Human Gate:</strong> OCR output is strictly candidate evidence. Planners must explicitly approve or relink.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                <CheckCircle2 size={16} style={{ color: '#047857', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Integrity Fingerprint:</strong> Attached photos are hashed via Web Crypto SHA-256 for tamper-evident provenance.
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions Feed */}
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title">
                  <Radio size={16} style={{ color: 'var(--brand-primary)' }} />
                  Recent Field Stream
                </h4>
                <div className="card-desc">Latest {recentSubmissions.length} field events ingested.</div>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentSubmissions.map(item => {
                  const match = matchResults[item.id];
                  const matchCategory = match?.category || 'review';
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedInspectorUpdateId(item.id);
                      }}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className="mono-pill" style={{ fontSize: '0.7rem' }}>{item.id}</span>
                          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.discipline}</span>
                          {item.confirmedTag && (
                            <span className="mono-pill" style={{ fontSize: '0.65rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                              Tag: {item.confirmedTag}
                            </span>
                          )}
                        </div>
                        <span
                          className="mono-pill"
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            background: matchCategory === 'ready' ? '#ecfdf5' : matchCategory === 'unplanned' ? '#fff1f2' : '#fffbeb',
                            color: matchCategory === 'ready' ? '#047857' : matchCategory === 'unplanned' ? '#991b1b' : '#b45309',
                            borderColor: matchCategory === 'ready' ? '#6ee7b7' : matchCategory === 'unplanned' ? '#fca5a5' : '#fde68a',
                          }}
                        >
                          {matchCategory.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.extractedDescription || item.rawText}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Area: <strong>{item.area || 'General'}</strong></span>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          Inspect <Eye size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
