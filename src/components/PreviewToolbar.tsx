import { ChevronLeft, Monitor, Tablet, Smartphone } from 'lucide-react';

export type DeviceType = 'desktop' | 'tablet-portrait' | 'tablet-landscape' | 'phone-portrait' | 'phone-landscape';

interface PreviewToolbarProps {
  onBack: () => void;
  selectedDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

const deviceConfigs: Record<DeviceType, { width: number; height: number; icon: React.ReactNode; label: string }> = {
  'desktop': {
    width: 1280,
    height: 720,
    icon: <Monitor size={20} />,
    label: 'Desktop',
  },
  'tablet-portrait': {
    width: 834,
    height: 1112,
    icon: <Tablet size={20} />,
    label: 'Tablet Portrait',
  },
  'tablet-landscape': {
    width: 1112,
    height: 834,
    icon: <Tablet size={20} style={{ transform: 'rotate(90deg)' }} />,
    label: 'Tablet Landscape',
  },
  'phone-portrait': {
    width: 390,
    height: 844,
    icon: <Smartphone size={20} />,
    label: 'Phone Portrait',
  },
  'phone-landscape': {
    width: 844,
    height: 390,
    icon: <Smartphone size={20} style={{ transform: 'rotate(90deg)' }} />,
    label: 'Phone Landscape',
  },
};

export function PreviewToolbar({ onBack, selectedDevice, onDeviceChange }: PreviewToolbarProps) {
  return (
    <div className="preview-toolbar">
      <div className="preview-toolbar-left">
        <button
          type="button"
          className="preview-back-button"
          onClick={onBack}
          aria-label="Back to editor"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="preview-toolbar-title">Lesson Preview</h2>
      </div>
      <div className="preview-toolbar-right">
        <div className="preview-device-icons">
          {(Object.keys(deviceConfigs) as DeviceType[]).map((device) => {
            const config = deviceConfigs[device];
            const isActive = selectedDevice === device;
            return (
              <button
                key={device}
                type="button"
                className={`preview-device-icon ${isActive ? 'active' : ''}`}
                onClick={() => onDeviceChange(device)}
                title={config.label}
                aria-label={config.label}
              >
                {config.icon}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="preview-edit-button"
          onClick={onBack}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export { deviceConfigs };

