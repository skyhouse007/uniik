declare global {
  interface Window {
    Razorpay?: new (options: any) => { open: () => void }
  }
}

export async function loadRazorpaySdk() {
  if (window.Razorpay) return true
  return await new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

