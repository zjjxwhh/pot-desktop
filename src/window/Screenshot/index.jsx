import React, { useEffect, useState, useRef } from 'react';
import { appCacheDir, join } from '@tauri-apps/api/path';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { warn } from '@tauri-apps/plugin-log';

const appWindow = getCurrentWebviewWindow();

export default function Screenshot() {
    const [imgurl, setImgurl] = useState('');
    const [isMoved, setIsMoved] = useState(false);
    const [isDown, setIsDown] = useState(false);
    const [mouseDownX, setMouseDownX] = useState(0);
    const [mouseDownY, setMouseDownY] = useState(0);
    const [mouseMoveX, setMouseMoveX] = useState(0);
    const [mouseMoveY, setMouseMoveY] = useState(0);

    const imgRef = useRef();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await invoke('screenshot');
                const filePath = await join(await appCacheDir(), 'pot_screenshot.png');
                if (!cancelled) setImgurl(`${convertFileSrc(filePath)}?t=${Date.now()}`);
            } catch (error) {
                warn(`Screenshot failed: ${error}`);
                await appWindow.close();
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <>
            <img
                ref={imgRef}
                className='fixed top-0 left-0 select-none'
                style={{ width: '100vw', height: '100vh', maxWidth: 'none', objectFit: 'fill' }}
                src={imgurl}
                draggable={false}
                onLoad={() => {
                    if (imgurl !== '' && imgRef.current.complete) {
                        void appWindow.show().then(() => appWindow.setFocus()).catch(async (error) => {
                            warn(`Screenshot overlay failed: ${error}`);
                            await appWindow.close();
                        });
                    }
                }}
            />
            <div
                className={`fixed bg-[#2080f020] border border-solid border-sky-500 ${!isMoved && 'hidden'}`}
                style={{
                    top: Math.min(mouseDownY, mouseMoveY),
                    left: Math.min(mouseDownX, mouseMoveX),
                    width: Math.abs(mouseDownX - mouseMoveX),
                    height: Math.abs(mouseDownY - mouseMoveY),
                }}
            />
            <div
                className='fixed top-0 left-0 bottom-0 right-0 cursor-crosshair select-none'
                onMouseDown={(e) => {
                    if (e.buttons === 1) {
                        setIsDown(true);
                        setMouseDownX(e.clientX);
                        setMouseDownY(e.clientY);
                        setMouseMoveX(e.clientX);
                        setMouseMoveY(e.clientY);
                    } else {
                        void appWindow.close();
                    }
                }}
                onMouseMove={(e) => {
                    if (isDown) {
                        setIsMoved(true);
                        setMouseMoveX(e.clientX);
                        setMouseMoveY(e.clientY);
                    }
                }}
                onMouseUp={async (e) => {
                    if (!isDown || e.button !== 0) return;
                    await appWindow.hide();
                    setIsDown(false);
                    setIsMoved(false);
                    const imgWidth = imgRef.current.naturalWidth;
                    const imgHeight = imgRef.current.naturalHeight;
                    const bounds = imgRef.current.getBoundingClientRect();
                    const scaleX = imgWidth / bounds.width;
                    const scaleY = imgHeight / bounds.height;
                    const left = Math.max(0, Math.floor((Math.min(mouseDownX, e.clientX) - bounds.left) * scaleX));
                    const top = Math.max(0, Math.floor((Math.min(mouseDownY, e.clientY) - bounds.top) * scaleY));
                    const right = Math.min(imgWidth, Math.floor((Math.max(mouseDownX, e.clientX) - bounds.left) * scaleX));
                    const bottom = Math.min(imgHeight, Math.floor((Math.max(mouseDownY, e.clientY) - bounds.top) * scaleY));
                    const width = right - left;
                    const height = bottom - top;
                    if (width <= 0 || height <= 0) {
                        warn('Screenshot area is too small');
                        await appWindow.close();
                    } else {
                        try {
                            await invoke('cut_image', { left, top, width, height });
                            await emit('success');
                        } catch (error) {
                            warn(`Screenshot crop failed: ${error}`);
                        } finally {
                            await appWindow.close();
                        }
                    }
                }}
            />
        </>
    );
}
