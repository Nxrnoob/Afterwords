"use client"

import { useEffect, useRef } from "react"

export function TimezoneSelect({
    name,
    defaultValue,
    className,
}: {
    name: string
    defaultValue?: string
    className?: string
}) {
    const selectRef = useRef<HTMLSelectElement>(null)

    useEffect(() => {
        // Auto-detect the user's timezone if no saved value exists
        if (!defaultValue && selectRef.current) {
            const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
            if (detected) {
                // Check if the detected timezone exists in options
                const optionExists = Array.from(selectRef.current.options).some(
                    opt => opt.value === detected
                )
                if (optionExists) {
                    selectRef.current.value = detected
                }
            }
        }
    }, [defaultValue])

    return (
        <select
            ref={selectRef}
            id={name}
            name={name}
            className={className}
            defaultValue={defaultValue || ""}
        >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (US)</option>
            <option value="America/Chicago">Central Time (US)</option>
            <option value="America/Denver">Mountain Time (US)</option>
            <option value="America/Los_Angeles">Pacific Time (US)</option>
            <option value="Europe/London">London (GMT/BST)</option>
            <option value="Europe/Paris">Central Europe (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Kolkata">India (IST)</option>
            <option value="Asia/Dubai">Dubai (GST)</option>
            <option value="Asia/Singapore">Singapore (SGT)</option>
            <option value="Australia/Sydney">Sydney (AEDT)</option>
        </select>
    )
}
