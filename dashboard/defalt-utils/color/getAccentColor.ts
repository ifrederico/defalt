export function getAccentColor() {
  const element = document.body.querySelector('.koenig-lexical') as HTMLElement | null
  return (element && getComputedStyle(element).getPropertyValue('--kg-accent-color')) || '#ff0095'
}
