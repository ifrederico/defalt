import type { SVGProps } from 'react'

export function EyedropperIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4.5 19.5 9 15l2.121-2.121M13.5 6 18 10.5M12.621 7.379l3 3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m18.182 3.818 2 2a2.25 2.25 0 0 1 0 3.182l-1.5 1.5-5.182-5.182 1.5-1.5a2.25 2.25 0 0 1 3.182 0Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
