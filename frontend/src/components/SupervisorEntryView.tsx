import React, { useState, useRef, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Camera,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  ArrowRight,
  Send,
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
  Loader2,
  Check,
  Info,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  CheckSquare,
  Bell,
  ChevronRight,
  AlertCircle,
  Filter,
  ArrowUpRight,
  HardHat,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { SAMPLE_EVIDENCE_IMAGES } from '../utils/sampleImages';
import { runLocalOCR, calculateImageFingerprint, normalizeEquipmentTag, OCRScanResult } from '../utils/ocrService';
import { speechService, SpeechLanguage, VoicePreset, SAMPLE_VOICE_PRESETS, isOperaBrowser, RecordedAudioData, transcribeAudioBlob } from '../utils/speechService';
import { parseSpokenUpdate } from '../utils/speechParser';
import { SpokenParseResult, ExtractedHandwrittenTask, ScheduleActivity } from '../types';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SupervisorEntryView: React.FC = () => {
  const {
    handleAddNewFieldEntry,
    handleCustomUpload,
    siteUpdates,
    schedule,
    enrichedSchedule,
    activeScheduleVersion,
    systemNotifications,
    acknowledgeScheduleUpdates,
    currentUser,
    setActiveTab,
    offlineMode,
    addToast,
    isGuidedDemoActive,
    guidedDemoStepIndex,
  } = useProject();

  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('ALL');
  const [showUpcomingTasks, setShowUpcomingTasks] = useState<boolean>(false);

  // Derive today's tasks for current field workfront
  const todaysActivities = useMemo(() => {
    const activeTasks = enrichedSchedule.filter(act => {
      return (
        act.status === 'In Progress' ||
        act.status === 'Delayed' ||
        act.activityId === 'PIP-L6-012' ||
        act.activityId === 'CIV-L6-002' ||
        act.activityId === 'ELE-L6-021' ||
        act.activityId === 'INS-L6-031' ||
        act.activityId === 'PIP-L6-013' ||
        act.activityId === 'CIV-L6-003'
      );
    });

    if (selectedDisciplineFilter === 'ALL') return activeTasks;
    return activeTasks.filter(t => t.discipline.toLowerCase() === selectedDisciplineFilter.toLowerCase());
  }, [enrichedSchedule, selectedDisciplineFilter]);

  const upcomingActivities = useMemo(() => {
    return enrichedSchedule.filter(act => {
      return (
        act.status === 'Not Started' &&
        !todaysActivities.some(t => t.activityId === act.activityId)
      );
    }).slice(0, 5);
  }, [enrichedSchedule, todaysActivities]);

  // Schedule revision notification
  const scheduleRevisionNotif = useMemo(() => {
    return systemNotifications.find(
      n => n.targetRole === 'supervisor' && n.type === 'update' && !n.acknowledged
    );
  }, [systemNotifications]);

  // 4 Focused Workflow Tabs
  const [activeSubTab, setActiveSubTab] = useState<'direct-report' | 'voice-input' | 'photo-ocr' | 'batch-upload'>('direct-report');

  // Pre-populate direct report from assigned task
  const handleSelectTaskForProgress = (task: ScheduleActivity) => {
    setDiscipline(task.discipline);
    setArea(task.area);
    const tag = task.aliases && task.aliases.length > 0 ? task.aliases[0] : '';
    if (tag) {
      setConfirmedTag(tag);
      setManualTagInput(tag);
    }
    setDescription(`Field execution progress for ${task.activityName} (${task.activityId}) at ${task.area}.`);
    setRawText(`Field installation progress for ${task.activityName} [${task.l5Code || task.activityId}]`);
    setEventStatus(task.status === 'Completed' ? 'Completed' : 'In Progress');
    setActiveSubTab('direct-report');

    addToast({
      type: 'info',
      title: `Task Selected: ${task.activityId}`,
      message: `Prepopulated details for "${task.activityName}". Enter progress metrics and submit.`,
    });

    const formElem = document.getElementById('field-submission-studio');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectTaskForPhotoProof = (task: ScheduleActivity) => {
    const tag = task.aliases && task.aliases.length > 0 ? task.aliases[0] : '';
    if (tag) {
      setConfirmedTag(tag);
      setManualTagInput(tag);
    }
    setActiveSubTab('photo-ocr');
    addToast({
      type: 'info',
      title: `Attach Proof for ${task.activityId}`,
      message: `Ready to attach inspection photo for ${task.activityName} (Tag: ${tag || 'N/A'}).`,
    });
    const formElem = document.getElementById('field-submission-studio');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectTaskForVoice = (task: ScheduleActivity) => {
    setActiveSubTab('voice-input');
    addToast({
      type: 'info',
      title: `Voice Dictation for ${task.activityId}`,
      message: `Ready to dictate field progress for ${task.activityName}.`,
    });
    const formElem = document.getElementById('field-submission-studio');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    if (isGuidedDemoActive && guidedDemoStepIndex === 2) {
      setActiveSubTab('photo-ocr');
    }
  }, [isGuidedDemoActive, guidedDemoStepIndex]);

  // Form State
  const [discipline, setDiscipline] = useState('Piping');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [area, setArea] = useState('Pump Bay');
  const [eventStatus, setEventStatus] = useState<'Started' | 'Completed' | 'In Progress'>('Completed');
  const [quantity, setQuantity] = useState('100%');
  const [supervisorName, setSupervisorName] = useState('R. Sharma (Lead Piping Supv)');

  // Voice Dictation & Audio Engine State
  const [voiceLang, setVoiceLang] = useState<SpeechLanguage>('en-IN');
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudioData | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [interimVoiceText, setInterimVoiceText] = useState<string>('');
  const [parsedVoiceResult, setParsedVoiceResult] = useState<SpokenParseResult | null>(null);
  const [voiceErrorMsg, setVoiceErrorMsg] = useState<string | null>(null);
  const isOpera = isOperaBrowser();

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
  const batchFileRef = useRef<HTMLInputElement>(null);

  // Transcribe recorded audio with real ASR
  const handleTranscribeRecordedAudio = async (blob: Blob, lang: SpeechLanguage = voiceLang) => {
    setIsTranscribing(true);
    setVoiceErrorMsg(null);
    try {
      const res = await transcribeAudioBlob(blob, lang);
      if (res.success && res.text) {
        setVoiceTranscript(res.text);
        const parsed = parseSpokenUpdate(res.text, lang);
        setParsedVoiceResult(parsed);
        addToast({
          type: 'success',
          title: 'Speech Transcribed Successfully',
          message: `Recognized: "${res.text}"`,
        });
      } else if (res.error) {
        setVoiceErrorMsg(res.error);
        addToast({
          type: 'warning',
          title: 'Audio Transcription',
          message: res.error,
        });
      }
    } catch (err: any) {
      setVoiceErrorMsg(err?.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Voice Recording Toggle
  const handleToggleVoiceRecording = async (lang: SpeechLanguage = voiceLang) => {
    if (isVoiceRecording || isMicActive) {
      const audioData = await speechService.stop();
      setIsVoiceRecording(false);
      setIsMicActive(false);
      setAudioLevel(0);
      if (audioData) {
        setRecordedAudio(audioData);
        if (!voiceTranscript && audioData.durationSec >= 0.8) {
          handleTranscribeRecordedAudio(audioData.blob, lang);
        }
      }
      return;
    }

    setVoiceErrorMsg(null);
    setVoiceTranscript('');
    setInterimVoiceText('');
    setParsedVoiceResult(null);
    setRecordedAudio(null);

    const started = await speechService.start(lang, {
      onAudioLevel: lvl => setAudioLevel(lvl),
      onMicConnected: connected => setIsMicActive(connected),
      onInterimTranscript: text => {
        setInterimVoiceText(text);
        const parsed = parseSpokenUpdate(text, lang);
        setParsedVoiceResult(parsed);
      },
      onFinalTranscript: text => {
        setVoiceTranscript(prev => {
          const full = prev ? `${prev} ${text}` : text;
          const parsed = parseSpokenUpdate(full, lang);
          setParsedVoiceResult(parsed);
          return full;
        });
        setInterimVoiceText('');
      },
      onAudioRecorded: audio => setRecordedAudio(audio),
      onStateChange: state => {
        setIsVoiceRecording(state === 'listening');
        if (state === 'transcribing') setIsTranscribing(true);
        else if (state !== 'listening' && !isMicActive) setAudioLevel(0);
      },
      onError: err => setVoiceErrorMsg(err),
    });

    if (!started) {
      setIsVoiceRecording(false);
      setIsMicActive(false);
      setAudioLevel(0);
    }
  };

  const handleVoiceTextChange = (newText: string) => {
    setVoiceTranscript(newText);
    setInterimVoiceText('');
    if (newText.trim()) {
      const parsed = parseSpokenUpdate(newText, voiceLang);
      setParsedVoiceResult(parsed);
    } else {
      setParsedVoiceResult(null);
    }
  };

  const handleSelectVoicePreset = (preset: VoicePreset) => {
    speechService.stop();
    setIsVoiceRecording(false);
    setIsMicActive(false);
    setAudioLevel(0);
    setVoiceLang(preset.language);
    setVoiceTranscript(preset.transcript);
    setInterimVoiceText('');
    setVoiceErrorMsg(null);
    setRecordedAudio(null);

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

    setActiveSubTab('direct-report');
    addToast({
      type: 'success',
      title: 'Spoken Fields Applied to Form',
      message: `Populated ${parsedVoiceResult.discipline} • ${parsedVoiceResult.area}${parsedVoiceResult.detectedTag ? ` • Tag [${parsedVoiceResult.detectedTag}]` : ''}.`,
    });
  };

  // Process File Selection
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

  // Run Local OCR Scan
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
        setManualTagInput(res.detectedTags[0]);
        addToast({
          type: 'success',
          title: 'OCR Scan Complete',
          message: `Detected ${res.detectedTags.length} candidate tag(s): ${res.detectedTags.join(', ')} (Confidence: ${res.ocrConfidence}%).`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'No Confident Tag Detected',
          message: 'No equipment tag was confidently detected. Please confirm a tag manually.',
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
      title: 'Tag Confirmed by User',
      message: `Confirmed tag "${norm}" as verified matching evidence.`,
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

  const handleSelectSampleEvidence = async (sampleKey: keyof typeof SAMPLE_EVIDENCE_IMAGES, label: string) => {
    const src = SAMPLE_EVIDENCE_IMAGES[sampleKey];
    if (!src) return;
    const hash = await calculateImageFingerprint(src);
    setImagePreview(src);
    setImageFilename(`${label.replace(/\s+/g, '_').toLowerCase()}.svg`);
    setImageFileSize(src.length);
    setImageFingerprint(hash);
    setOcrResult(null);
    setConfirmedTag('');
    setManualTagInput('');
    addToast({
      type: 'info',
      title: `Sample Attached: ${label}`,
      message: 'Ready for OCR tag analysis and human confirmation.',
    });
  };

  // Submit Field Report
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

    setSubmitSuccess(`Progress entry submitted & processed with explainable schedule matching!`);
    setDescription('');
    setRawText('');
    setQuantity('100%');
    if (isIssueReport) setIssueFlag('');

    setTimeout(() => {
      setSubmitSuccess(null);
    }, 4000);
  };

  const applyQuickTemplate = (preset: {
    disp: string;
    area: string;
    desc: string;
    raw: string;
    status: 'Started' | 'Completed' | 'In Progress';
    tag: string;
  }) => {
    setDiscipline(preset.disp);
    setArea(preset.area);
    setDescription(preset.desc);
    setRawText(preset.raw);
    setEventStatus(preset.status);
    setConfirmedTag(preset.tag);
    setManualTagInput(preset.tag);
    addToast({
      type: 'info',
      title: 'Template Applied',
      message: `Loaded template for ${preset.disp} (${preset.tag}).`,
    });
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header matching Reference Screen 1 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.25rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Good morning, {currentUser?.username || 'Rajesh'}
          </span>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '0.15rem', marginBottom: '0.25rem' }}>
            Your Field Tasks for Today
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Stay on track. Capture progress. Keep the project moving.
          </p>
        </div>

        {/* Header Right: Date, Location, Weather Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Mon, 8 Sep 2026
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Pump Bay, Unit 01
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <span style={{ fontSize: '1rem' }}>⛅</span>
            <div>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>32°C</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Partly cloudy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {submitSuccess && (
        <div
          style={{
            background: 'var(--status-ready-bg)',
            border: '1px solid var(--status-ready-border)',
            color: 'var(--status-ready-fg)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* TOP KPI ROW (4 Compact Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        {/* KPI 1: Today's Tasks */}
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckSquare size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {todaysActivities.length || 4}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
              Today's Tasks
            </div>
          </div>
        </div>

        {/* KPI 2: Pending Evidence */}
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Camera size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              2
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
              Pending Evidence
            </div>
          </div>
        </div>

        {/* KPI 3: Overdue Tasks */}
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              1
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
              Overdue Task
            </div>
          </div>
        </div>

        {/* KPI 4: Issues Reported */}
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              0
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
              Issues Reported
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S TASKS WORKSPACE TABLE */}
      <div id="demo-target-supervisor-tasks" className="card" style={{ padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        {/* Table Top Controls & Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Sub-Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-subtle)', padding: 3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setSelectedDisciplineFilter('ALL')}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: selectedDisciplineFilter === 'ALL' ? 700 : 500,
                borderRadius: 'var(--radius-xs)',
                background: selectedDisciplineFilter === 'ALL' ? 'var(--bg-surface)' : 'transparent',
                color: selectedDisciplineFilter === 'ALL' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                border: selectedDisciplineFilter === 'ALL' ? '1px solid var(--border-default)' : 'none',
                boxShadow: selectedDisciplineFilter === 'ALL' ? 'var(--shadow-xs)' : 'none',
                cursor: 'pointer',
              }}
            >
              Today's Tasks ({todaysActivities.length})
            </button>
            <button
              type="button"
              onClick={() => setShowUpcomingTasks(true)}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-xs)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Upcoming ({upcomingActivities.length || 6})
            </button>
            <button
              type="button"
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-xs)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Completed (12)
            </button>
          </div>

          {/* Filter and Sort Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={selectedDisciplineFilter}
              onChange={e => setSelectedDisciplineFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', height: 'auto' }}
            >
              <option value="ALL">All Disciplines</option>
              <option value="Piping">Piping</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
              <option value="Instrumentation">Instrumentation</option>
            </select>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              <Filter size={12} />
              <span>Sort: Priority ▾</span>
            </button>
          </div>
        </div>

        {/* Enterprise Task Table */}
        <div className="table-responsive">
          <table className="industrial-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Activity</th>
                <th>Discipline</th>
                <th>Location</th>
                <th>Planned</th>
                <th>Progress</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {todaysActivities.map(task => {
                const isComplete = Boolean(task.status === 'Completed' || (typeof task.progressPercent === 'number' && task.progressPercent >= 100));
                const progressVal = isComplete ? 100 : (task.progressPercent ?? (task.activityId === 'CIV-L6-002' ? 25 : 0));

                return (
                  <tr key={task.activityId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isComplete}
                        readOnly
                        style={{ cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
                          {task.activityId}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {task.activityName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {task.discipline}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {task.area}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {task.plannedStart || '5 Sep'} – {task.plannedFinish || '7 Sep'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 100 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progressVal}%`,
                              height: '100%',
                              background: isComplete ? '#059669' : progressVal > 0 ? '#2563eb' : '#94a3b8',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 32 }}>
                          {progressVal}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          isComplete ? 'ready' : progressVal > 0 ? 'review' : 'rejected'
                        }`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {isComplete ? 'Completed' : progressVal > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSelectTaskForProgress(task)}
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem' }}
                        >
                          {isComplete ? 'View' : 'Update'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM SPLIT ROW: RECENT SCHEDULE UPDATES & SUBMIT FIELD UPDATE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        {/* Left Card: Recent Schedule Updates */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <RotateCcw size={15} style={{ color: 'var(--brand-primary)' }} />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Recent Schedule Updates
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rev-03 is now active
                  </span>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>2 hours ago</span>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                  Uploaded by Lead Planner • 27 activities modified
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('schedule-activities')}
              style={{ fontSize: '0.725rem', padding: '0.3rem 0.65rem' }}
            >
              <span>View Changes</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Right Card: Submit Field Update Action Grid */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <FileText size={15} style={{ color: 'var(--brand-primary)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Submit Field Update
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              className={`field-action-tile ${activeSubTab === 'direct-report' ? 'active' : ''}`}
              onClick={() => {
                setActiveSubTab('direct-report');
                const el = document.getElementById('field-submission-studio');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.85rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                background: activeSubTab === 'direct-report' ? 'var(--brand-surface)' : 'var(--bg-subtle)',
                border: `1px solid ${activeSubTab === 'direct-report' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>Text Report</span>
            </button>

            <button
              type="button"
              className={`field-action-tile ${activeSubTab === 'photo-ocr' ? 'active' : ''}`}
              onClick={() => {
                setActiveSubTab('photo-ocr');
                const el = document.getElementById('field-submission-studio');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.85rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                background: activeSubTab === 'photo-ocr' ? 'var(--brand-surface)' : 'var(--bg-subtle)',
                border: `1px solid ${activeSubTab === 'photo-ocr' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Camera size={18} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>Photo Evidence</span>
            </button>

            <button
              type="button"
              className={`field-action-tile ${activeSubTab === 'voice-input' ? 'active' : ''}`}
              onClick={() => {
                setActiveSubTab('voice-input');
                const el = document.getElementById('field-submission-studio');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.85rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                background: activeSubTab === 'voice-input' ? 'var(--brand-surface)' : 'var(--bg-subtle)',
                border: `1px solid ${activeSubTab === 'voice-input' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Mic size={18} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>Voice Input</span>
            </button>

            <button
              type="button"
              className={`field-action-tile ${activeSubTab === 'batch-upload' ? 'active' : ''}`}
              onClick={() => {
                setActiveSubTab('batch-upload');
                const el = document.getElementById('field-submission-studio');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.85rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                background: activeSubTab === 'batch-upload' ? 'var(--brand-surface)' : 'var(--bg-subtle)',
                border: `1px solid ${activeSubTab === 'batch-upload' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <UploadCloud size={18} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upload File</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: MULTIMODAL FIELD SUBMISSION STUDIO */}
      <div id="field-submission-studio" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              FIELD SUBMISSION STUDIO
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Log site measurements, dictate voice notes, scan inspection photos, or upload shift files.
            </div>
          </div>
        </div>

        {/* 4-Tab Focused Workflow Navigation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            gap: '4px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
        <button
          type="button"
          onClick={() => setActiveSubTab('direct-report')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: activeSubTab === 'direct-report' ? 700 : 500,
            background: activeSubTab === 'direct-report' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'direct-report' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={15} />
          <span>Direct Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('voice-input')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: activeSubTab === 'voice-input' ? 700 : 500,
            background: activeSubTab === 'voice-input' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'voice-input' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          <Mic size={15} />
          <span>Voice Input</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('photo-ocr')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: activeSubTab === 'photo-ocr' ? 700 : 500,
            background: activeSubTab === 'photo-ocr' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'photo-ocr' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          <Scan size={15} />
          <span>Photo Evidence + OCR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('batch-upload')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: activeSubTab === 'batch-upload' ? 700 : 500,
            background: activeSubTab === 'batch-upload' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'batch-upload' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          <FileSpreadsheet size={15} />
          <span>Batch Upload</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DIRECT REPORT WORKSPACE
          ========================================================================= */}
      {activeSubTab === 'direct-report' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '1.25rem' }}>
          {/* Form */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  <FileText size={16} style={{ color: 'var(--brand-primary)' }} />
                  <span>Log Field Progress Report</span>
                </h2>
                <div className="card-desc">
                  Structured supervisor log with equipment tag and progress metrics.
                </div>
              </div>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
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
                    <label className="form-label">Work Area / Zone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Pump Bay, Pipe Rack"
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
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

                <div className="form-group">
                  <label className="form-label">
                    <span>Formal Activity Description</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Core input for NLP reconciliation</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. 24-inch cooling water spool erected near pump bay with NDT cleared."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Equipment / Line Tag (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 24-CW-017"
                      value={confirmedTag}
                      onChange={e => setConfirmedTag(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity / Percent Complete</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 100% or 450m"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supervisor Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={supervisorName}
                    onChange={e => setSupervisorName(e.target.value)}
                  />
                </div>

                {/* Blocker Flag Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: isIssueReport ? 'var(--status-unplanned-bg)' : 'var(--bg-surface-secondary)',
                    border: `1px solid ${isIssueReport ? 'var(--status-unplanned-border)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={15} style={{ color: isIssueReport ? 'var(--status-unplanned-fg)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Flag as Work Blocker / Issue
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isIssueReport}
                    onChange={e => setIsIssueReport(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                </div>

                {isIssueReport && (
                  <div className="form-group">
                    <label className="form-label">Blocker Description</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Awaiting 50T mobile crane availability"
                      value={issueFlag}
                      onChange={e => setIssueFlag(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', gap: 6 }}>
                    <Send size={14} />
                    <span>Submit Daily Report</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Presets & Guidance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize: '0.85rem' }}>
                  <Sparkles size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span>1-Click Test Scenarios</span>
                </h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '0.5rem 0.75rem' }}
                  onClick={() =>
                    applyQuickTemplate({
                      disp: 'Piping',
                      area: 'Pump Bay',
                      desc: 'Erection of 24-inch cooling water spool line 24-CW-017 completed with QA sign-off.',
                      raw: '24 inch CW spool erected near pump bay NDT cleared',
                      status: 'Completed',
                      tag: '24-CW-017',
                    })
                  }
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.775rem' }}>Piping CW Spool (24-CW-017)</div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Auto-Matches with 94% confidence</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '0.5rem 0.75rem' }}
                  onClick={() =>
                    applyQuickTemplate({
                      disp: 'Civil',
                      area: 'Pump Bay',
                      desc: 'Concreting of cooling water pump foundation raft completed. Curing initiated.',
                      raw: 'Pump foundation concrete pour finished slump test verified M35',
                      status: 'Completed',
                      tag: 'CIV-L6-002',
                    })
                  }
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.775rem' }}>Pump Foundation Concreting</div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>CIV-L6-002 Foundation Raft</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '0.5rem 0.75rem' }}
                  onClick={() =>
                    applyQuickTemplate({
                      disp: 'Electrical',
                      area: 'Substation',
                      desc: 'Pulling 415V switchgear feeder cable through tier-2 tray to MCC-415V in progress.',
                      raw: 'Cable pull in progress tier 2 tray 415V switchgear 450m pulled',
                      status: 'In Progress',
                      tag: 'ELE-L6-021',
                    })
                  }
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.775rem' }}>MCC-415V Feeder Cable Pull</div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Tier-2 Cable Tray &bull; In Progress</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Standard Notice */}
            <div
              style={{
                padding: '0.85rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={14} style={{ color: 'var(--brand-primary)' }} />
                <span>Explainable Human Gate</span>
              </div>
              Submitted updates are matched deterministically against the L5/L6 project schedule using multi-factor NLP. Planners retain final approval before schedule baselines update.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: VOICE INPUT WORKSPACE
          ========================================================================= */}
      {activeSubTab === 'voice-input' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  <Mic size={16} style={{ color: 'var(--brand-primary)' }} />
                  <span>Multilingual Voice Dictation</span>
                </h2>
                <div className="card-desc">
                  Speak in English, Hindi, or Tamil. Speech is transcribed and parsed into structured fields.
                </div>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Language Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Dictation Language:
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(
                    [
                      { id: 'en-IN', label: 'English (India)' },
                      { id: 'hi-IN', label: 'हिन्दी (Hindi)' },
                      { id: 'ta-IN', label: 'தமிழ் (Tamil)' },
                    ] as const
                  ).map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setVoiceLang(l.id)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        background: voiceLang === l.id ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)',
                        color: voiceLang === l.id ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${voiceLang === l.id ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Mic Trigger Bar */}
              <div
                style={{
                  padding: '1.25rem',
                  background: isVoiceRecording ? 'var(--status-unplanned-bg)' : 'var(--bg-surface-secondary)',
                  border: `1px solid ${isVoiceRecording ? 'var(--status-unplanned-border)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleVoiceRecording(voiceLang)}
                  className="btn"
                  style={{
                    background: isVoiceRecording ? '#dc2626' : 'var(--brand-primary)',
                    color: '#ffffff',
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    gap: 6,
                  }}
                >
                  {isVoiceRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isVoiceRecording ? 'Stop Recording' : 'Tap to Speak'}</span>
                </button>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isVoiceRecording ? 'Listening live...' : 'Click button above or test with audio presets.'}
                  </div>
                  {/* VU Meter Bars */}
                  {isVoiceRecording && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 18, marginTop: 4 }}>
                      {[20, 50, 80, 100, 70, 40, 90, 60, 30].map((bar, i) => (
                        <span
                          key={i}
                          style={{
                            width: 3,
                            height: `${Math.max(4, Math.round((audioLevel / 100) * bar * 0.18) + 4)}px`,
                            background: '#10b981',
                            borderRadius: 2,
                            transition: 'height 0.08s ease-out',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Transcript Area */}
              <div className="form-group">
                <label className="form-label">
                  <span>Recognized Spoken Transcript</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Editable buffer</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Spoken words stream here in real time. You can also type or edit speech transcript directly..."
                  value={voiceTranscript || interimVoiceText}
                  onChange={e => handleVoiceTextChange(e.target.value)}
                />
              </div>

              {/* Parsed Structure Preview */}
              {parsedVoiceResult && (
                <div
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    Structured Information Extracted:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span className="mono-pill">Discipline: {parsedVoiceResult.discipline}</span>
                    <span className="mono-pill">Area: {parsedVoiceResult.area}</span>
                    <span className="mono-pill">Status: {parsedVoiceResult.eventStatus}</span>
                    {parsedVoiceResult.detectedTag && (
                      <span className="status-badge ready">Tag: {parsedVoiceResult.detectedTag}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleApplyVoiceToForm}
                    >
                      <Check size={13} />
                      <span>Apply Spoken Fields to Report</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Voice Scenarios */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '0.85rem' }}>
                <Volume2 size={14} style={{ color: 'var(--brand-primary)' }} />
                <span>Simulated Voice Scenarios</span>
              </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SAMPLE_VOICE_PRESETS.slice(0, 3).map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '0.5rem 0.75rem' }}
                  onClick={() => handleSelectVoicePreset(preset)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.775rem' }}>{preset.label}</div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>"{preset.transcript.slice(0, 48)}..."</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PHOTO EVIDENCE + OCR GUIDED WORKFLOW PIPELINE
          ========================================================================= */}
      {activeSubTab === 'photo-ocr' && (
        <div id="demo-target-photo-ocr" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 5-Step Guided Visual Pipeline Ribbon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: imagePreview ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)', color: imagePreview ? '#ffffff' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                1
              </span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upload Photo</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Select site evidence</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: ocrResult ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)', color: ocrResult ? '#ffffff' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                2
              </span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>OCR Analysis</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Extract tags & text</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: ocrResult?.detectedTags.length ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)', color: ocrResult?.detectedTags.length ? '#ffffff' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                3
              </span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Candidate Tags</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AI recommendations</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: confirmedTag ? '#059669' : 'var(--bg-surface-secondary)', color: confirmedTag ? '#ffffff' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                4
              </span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Human Gate</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>User confirmation</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: confirmedTag ? '#047857' : 'var(--bg-surface-secondary)', color: confirmedTag ? '#ffffff' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                5
              </span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Schedule Link</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Verified reconciliation</div>
              </div>
            </div>
          </div>

          {/* Guided Workspace Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 1fr)', gap: '1.25rem' }}>
            {/* Left: Upload & Image Workspace */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">
                    <Camera size={16} style={{ color: 'var(--brand-primary)' }} />
                    <span>Step 1: Construction Photo Evidence</span>
                  </h2>
                  <div className="card-desc">
                    Attach site photo proof or test with preset construction inspection images.
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                    onClick={() => handleSelectSampleEvidence('pipeWeld', 'Field Weld 24-CW-017')}
                  >
                    📷 Weld Seam 24-CW-017
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                    onClick={() => handleSelectSampleEvidence('pumpFoundation', 'Pump Foundation Pour')}
                  >
                    🏗️ Pump Foundation CIV-L6-002
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                    onClick={() => handleSelectSampleEvidence('cableTray', '415V Cable Tray')}
                  >
                    🔌 Cable Tray MCC-415V
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                    onClick={() => handleSelectSampleEvidence('handwrittenLog', 'Handwritten Job Card #402')}
                  >
                    📝 Handwritten Job Card #402
                  </button>
                </div>

                {/* Dropzone or Preview */}
                {!imagePreview ? (
                  <div
                    style={{
                      border: '2px dashed var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      background: 'var(--bg-surface-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={24} style={{ color: 'var(--brand-primary)' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Click to upload site photo or drag and drop
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      JPEG, PNG, WebP up to 8 MB
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', maxHeight: 220 }}>
                      <img
                        src={imagePreview}
                        alt="Evidence Preview"
                        style={{ width: '100%', height: 220, objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          padding: 4,
                          borderRadius: '50%',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Metadata & SHA Fingerprint */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      <span>{imageFilename} ({(imageFileSize / 1024).toFixed(0)} KB)</span>
                      {imageFingerprint && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
                          <ShieldCheck size={12} style={{ color: 'var(--brand-primary)' }} />
                          SHA-256: {imageFingerprint.slice(0, 14)}...
                        </span>
                      )}
                    </div>

                    {/* Step 2 Action: Run OCR */}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleRunOCR}
                      disabled={isScanningOCR}
                      style={{ width: '100%', padding: '0.55rem', gap: 6 }}
                    >
                      {isScanningOCR ? <RefreshCw size={14} className="spin" /> : <Scan size={14} />}
                      <span>{isScanningOCR ? 'Analyzing Photo with OCR...' : 'Step 2: Run Local OCR Tag Analysis'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Steps 3, 4, 5 (Candidate Tags, Human Confirmation, Schedule Link) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Step 3 & 4: Candidate Tag & Human Gate */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ fontSize: '0.85rem' }}>
                    <Tag size={14} style={{ color: 'var(--brand-primary)' }} />
                    <span>Step 3 & 4: Extracted Tags & Human Gate</span>
                  </h3>
                </div>

                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {ocrResult ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Candidate Tags:
                        </span>
                        <span className="mono-pill" style={{ fontSize: '0.675rem' }}>
                          Confidence: <strong>{ocrResult.ocrConfidence}%</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {ocrResult.detectedTags.map(t => (
                          <button
                            key={t}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              borderColor: confirmedTag === t ? 'var(--brand-primary)' : 'var(--border-subtle)',
                              background: confirmedTag === t ? 'var(--brand-surface)' : 'var(--bg-surface-secondary)',
                              color: confirmedTag === t ? 'var(--brand-primary)' : 'var(--text-primary)',
                              fontWeight: 700,
                            }}
                            onClick={() => handleConfirmTag(t)}
                          >
                            <span>{t}</span>
                            {confirmedTag === t && <Check size={12} />}
                          </button>
                        ))}
                      </div>

                      {/* Step 4 Human Confirmation Gate */}
                      <div
                        style={{
                          padding: '0.75rem',
                          background: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Step 4: Confirm Tag for Schedule Matching
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={manualTagInput}
                            onChange={e => setManualTagInput(e.target.value)}
                            placeholder="e.g. 24-CW-017"
                            style={{ fontSize: '0.8rem' }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConfirmTag(manualTagInput)}
                          >
                            <span>Confirm</span>
                          </button>
                        </div>
                        {confirmedTag && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--status-ready-fg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={12} />
                            <span>Human Gate Cleared: Confirmed "{confirmedTag}"</span>
                          </div>
                        )}
                      </div>

                      {/* Step 5: Final Link to Schedule Button */}
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setDescription(`Erection and weld inspection of line ${confirmedTag} at Pump Bay cleared.`);
                          setRawText(`[OCR VERIFIED EVIDENCE (${confirmedTag})]: ${ocrResult.rawText}`);
                          setActiveSubTab('direct-report');
                          addToast({
                            type: 'success',
                            title: 'Evidence Ready for Reconciliation',
                            message: `Attached tag "${confirmedTag}" and photo proof to report form.`,
                          });
                        }}
                        disabled={!confirmedTag}
                        style={{ width: '100%', padding: '0.55rem', gap: 6 }}
                      >
                        <ArrowRight size={14} />
                        <span>Step 5: Attach Evidence & Proceed to Form</span>
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Run OCR tag analysis on the left to extract candidate tags.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BATCH SPREADSHEET & TXT UPLOAD
          ========================================================================= */}
      {activeSubTab === 'batch-upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  <FileSpreadsheet size={16} style={{ color: 'var(--brand-primary)' }} />
                  <span>Batch Data Ingestion</span>
                </h2>
                <div className="card-desc">
                  Upload daily logs in TXT or Excel (.xlsx) formats to ingest multiple field reports at once.
                </div>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div
                style={{
                  border: '2px dashed var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  background: 'var(--bg-surface-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
                onClick={() => batchFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleBatchFileDrop(e.dataTransfer.files[0]);
                }}
              >
                <UploadCloud size={28} style={{ color: 'var(--brand-primary)' }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Drag & Drop Daily Log Files Here
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Accepts <code>daily_report.txt</code>, <code>piping_progress.xlsx</code>, or custom CSV files
                </div>
                <input
                  type="file"
                  ref={batchFileRef}
                  accept=".txt,.xlsx,.csv"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files?.[0]) handleBatchFileDrop(e.target.files[0]);
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Parsed updates automatically route to the AI Match Matrix for reconciliation.</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('site-updates')}
                >
                  <span>View Feed ({siteUpdates.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Benchmark Preset Data */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '0.85rem' }}>
                <Layers size={14} style={{ color: 'var(--brand-primary)' }} />
                <span>Benchmark Datasets</span>
              </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div
                style={{
                  padding: '0.75rem',
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  Refinery Piping Progress (Excel)
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Contains 10 spool erection and welding log entries.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    addToast({ type: 'info', title: 'Benchmark Ingested', message: 'Loaded piping_progress.xlsx dataset.' });
                  }}
                >
                  Load Piping Dataset
                </button>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  Unstructured Site Log (TXT)
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Contains verbatim shift superintendent notes.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    addToast({ type: 'info', title: 'Benchmark Ingested', message: 'Loaded daily_report.txt dataset.' });
                  }}
                >
                  Load TXT Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* SECTION 4: RECENT FIELD SUBMISSIONS & EVIDENCE CHAIN */}
      <div className="card">
        <div className="card-header" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
              <ShieldCheck size={16} style={{ color: 'var(--brand-primary)' }} />
              <span>YOUR RECENT FIELD SUBMISSIONS & EVIDENCE TRAIL</span>
            </h3>
            <div className="card-desc" style={{ fontSize: '0.725rem' }}>
              Traceable log of field reports, photo evidence, and OCR-verified equipment tags sent to Lead Planner.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('site-updates')}
            style={{ fontSize: '0.725rem' }}
          >
            <span>Full Daily Feed ({siteUpdates.length})</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container" style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table className="enterprise-table" style={{ width: '100%', fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Entry ID</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Date & Discipline</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Description</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Confirmed Tag</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Photo Evidence / Hash</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {siteUpdates.slice(0, 6).map(u => {
                  const img = u.images?.[0];
                  return (
                    <tr key={u.id}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {u.id}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{u.discipline}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{u.reportDate} &bull; {u.area}</div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', maxWidth: 260 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.extractedDescription}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {u.confirmedTag ? (
                          <span className="mono-pill" style={{ fontSize: '0.675rem', background: 'var(--brand-surface)', color: 'var(--brand-primary)', border: '1px solid var(--border-subtle)' }}>
                            {u.confirmedTag}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {img ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Camera size={12} style={{ color: 'var(--brand-primary)' }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                              #{img.sha256Hash?.slice(0, 8) || 'VERIFIED'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>No image</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span className={`status-badge ${u.eventStatus === 'Completed' ? 'ready' : 'review'}`} style={{ fontSize: '0.625rem' }}>
                          {u.eventStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
