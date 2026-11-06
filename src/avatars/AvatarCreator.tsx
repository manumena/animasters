import { useId, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AvatarPortrait from './AvatarPortrait';
import { avatarOptionLabel, cycleAvatar, palettes } from './catalog';
import type { AvatarConfig, AvatarSetting } from './protocol';
import './AvatarCreator.css';

const groups = [
  {
    label: 'Hair & skin',
    rows: [
      { setting: 'hair', label: 'Hair style' },
      { setting: 'hairColor', label: 'Hair color' },
      { setting: 'skin', label: 'Skin color' },
    ],
  },
  {
    label: 'Face & prop',
    rows: [
      { setting: 'eyes', label: 'Eyes' },
      { setting: 'expression', label: 'Expression' },
      { setting: 'prop', label: 'Prop' },
    ],
  },
] as const;

interface AvatarCreatorProps {
  avatar: AvatarConfig;
  nickname: string;
  disabled: boolean;
  onChange: (avatar: AvatarConfig) => void;
}

function swatchColor(avatar: AvatarConfig, setting: AvatarSetting) {
  const color = setting === 'hairColor'
    ? palettes.hairColor[avatar.hairColor]
    : setting === 'skin' ? palettes.skin[avatar.skin] : undefined;
  if (color) return 'rgb(' + color.rgb.join(' ') + ')';
}

export default function AvatarCreator({ avatar, nickname, disabled, onChange }: AvatarCreatorProps) {
  const headingId = useId();
  const [group, setGroup] = useState(0);

  return (
    <section className="avatar-creator" aria-labelledby={headingId}>
      <div className="avatar-creator-heading" id={headingId}>Avatar</div>
      <AvatarPortrait avatar={avatar} nickname={nickname} preview />

      <div className="avatar-creator-groups" role="group" aria-label="Avatar categories">
        {groups.map(({ label }, index) => (
          <button key={label} type="button" aria-pressed={index === group} disabled={disabled} onClick={() => setGroup(index)}>
            {label}
          </button>
        ))}
      </div>

      <div className="avatar-creator-rows">
        {groups[group].rows.map(({ setting, label }) => {
          const color = swatchColor(avatar, setting);

          return (
            <div className="avatar-creator-row" key={setting}>
              <button
                type="button"
                aria-label={'Previous ' + label.toLowerCase()}
                disabled={disabled}
                onClick={() => onChange(cycleAvatar(avatar, setting, -1))}
              >
                <FiChevronLeft aria-hidden="true" />
              </button>
              <div className="avatar-creator-value" aria-live="polite" aria-atomic="true">
                <span>{label}</span>
                <strong>
                  {color && <i aria-hidden="true" style={{ backgroundColor: color }} />}
                  {avatarOptionLabel(avatar, setting)}
                </strong>
              </div>
              <button
                type="button"
                aria-label={'Next ' + label.toLowerCase()}
                disabled={disabled}
                onClick={() => onChange(cycleAvatar(avatar, setting, 1))}
              >
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
