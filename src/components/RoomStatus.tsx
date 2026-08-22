// arquivo: aviso de configuração pendente da sala (mundo/mestre)
// local: src\components\RoomStatusBanner.tsx

'use client';
import {useState} from 'react';
import type {Campaign} from '@/types/campaign';
import ModalMaster from '@/components/ModalMaster';
import ModalWorld from '@/components/ModalWorld';

interface RoomStatusBannerProps {
  campaign: Campaign;
}

export default function RoomStatusBanner({campaign}: RoomStatusBannerProps) {
  const [modalMaster, setModalMaster] = useState(false);
  const [modalWorld, setModalWorld] = useState(false);

  const missingWorld = !campaign.world;
  const missingMaster = !campaign.master?.system;

  if (!missingWorld && !missingMaster) return null;

  return (
    <div className="alertBox alertBox--info">
      {missingWorld && (
        <p>
          Esta sala ainda não tem um mundo configurado.{' '}
          <button type="button" className="linkButton" onClick={() => setModalWorld(true)}>
            Clique aqui
          </button>
        </p>
      )}

      {missingMaster && (
        <p>
          Esta sala ainda não tem um mestre configurado.{' '}
          <button type="button" className="linkButton" onClick={() => setModalMaster(true)}>
            Clique aqui
          </button>
        </p>
      )}

      {modalMaster && <ModalMaster campaign={campaign} onClose={() => setModalMaster(false)} />}
      {modalWorld && <ModalWorld campaign={campaign} onClose={() => setModalWorld(false)} />}
    </div>
  );
}