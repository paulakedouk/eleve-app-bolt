import Link from 'next/link';
import Header from '../components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <section className="bg-gray-50 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-16 h-16 bg-yellow-400 rotate-45 hidden lg:block"></div>
          <div className="absolute bottom-10 left-10 w-12 h-12 bg-red-400 rounded-full hidden lg:block"></div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              NEXT-GEN{' '}
              <span 
                className="bg-blue-600 text-white px-4 py-2 inline-block transform -rotate-1 border-2 border-black rounded-lg"
                style={{
                  WebkitTextStrokeColor: 'black',
                  WebkitTextStrokeWidth: '2px'
                }}
              >
                SKATE
              </span>{' '}
              SCHOOL<br />PLATFORM
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Transform your skateboarding instruction with AI-powered video analysis,
              seamless family connections, and gamified learning experiences that keep
              students engaged and progressing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/start-school" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                START YOUR SCHOOL
              </Link>
              <Link 
                href="#portal" 
                className="bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                FIND YOUR PORTAL
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">500+</div>
              <div className="text-sm md:text-base font-medium text-gray-300">STUDENTS COACHED</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">50+</div>
              <div className="text-sm md:text-base font-medium text-gray-300">PARTNER SCHOOLS</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">10K+</div>
              <div className="text-sm md:text-base font-medium text-gray-300">TRICKS ANALYZED</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">98%</div>
              <div className="text-sm md:text-base font-medium text-gray-300">PARENT SATISFACTION</div>
            </div>
          </div>
        </div>
      </section>

      {/* Built For Everyone Section */}
      <section id="audience" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-16 h-16 bg-green-400 rotate-45 hidden lg:block"></div>
          
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              BUILT FOR EVERYONE
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every member of your skate community gets exactly what they need to succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border-4 border-blue-600 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.3)]">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-yellow-400 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-4">FOR STUDENTS</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Track your tricks, unlock badges, and see how far you&apos;ve come—all in your own digital
                skate log that grows with every session.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border-4 border-red-500 shadow-[8px_8px_0px_0px_rgba(239,68,68,0.3)]">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-yellow-400 rounded-sm"></div>
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-4">FOR COACHES</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Assign goals, tag students in clips, leave voice notes, and review progress with AI-
                powered tools that make teaching more effective.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border-4 border-green-600 shadow-[8px_8px_0px_0px_rgba(34,197,94,0.3)]">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                  <div className="w-4 h-4 bg-gray-800 rounded-full ml-1"></div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-4">FOR PARENTS</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Stay updated on your child&apos;s journey. See highlights, milestones, and session
                feedback—all in one place, all the time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section id="features" className="py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-400 rotate-45 hidden lg:block"></div>
          
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              POWERFUL FEATURES
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run a modern skate school, built by skaters for skaters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border-4 border-blue-600 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)]">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">TRICK VIDEO ANALYSIS</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI-powered analysis breaks down every ollie, kickflip, and grind with precision feedback that accelerates
                learning curves and helps students perfect their technique.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-4 border-red-500 shadow-[6px_6px_0px_0px_rgba(239,68,68,0.3)]">
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">PARENT UPDATES</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Keep parents in the loop with real-time progress updates, session highlights, and milestone
                notifications that strengthen the family-coach connection.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-4 border-yellow-500 shadow-[6px_6px_0px_0px_rgba(234,179,8,0.3)]">
              <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">STUDENT PROGRESS TRACKING</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Track every trick mastered, every session completed, and every milestone achieved with detailed
                analytics and comprehensive progress reports.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-4 border-green-600 shadow-[6px_6px_0px_0px_rgba(34,197,94,0.3)]">
              <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">XP & BADGES SYSTEM</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Level up the learning experience with experience points, skill badges, and friendly competition that keeps
                students motivated and engaged.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-4 border-purple-600 shadow-[6px_6px_0px_0px_rgba(147,51,234,0.3)]">
              <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">MOBILE-FIRST DESIGN</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Access your platform anywhere with responsive design that works perfectly whether you&apos;re at the skate
                park or planning from home.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-4 border-orange-500 shadow-[6px_6px_0px_0px_rgba(249,115,22,0.3)]">
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">SECURE & PRIVATE</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Bank-level security with role-based access ensures student data stays protected while maintaining easy
                access for families and coaches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12">
              TRUSTED BY
            </h2>
            <div className="flex justify-center">
              <div className="h-16 w-auto bg-gray-200 rounded-lg flex items-center justify-center px-8">
                <span className="text-gray-600 font-bold">LVL UP Academy & High Performance Centre</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flexible Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Decorative elements */}
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-400 rounded-full hidden lg:block"></div>
          
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            FLEXIBLE PRICING
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Choose a plan that fits your school—whether you&apos;re just starting out
            or managing hundreds of students.
          </p>
          
          <div className="inline-block bg-yellow-400 text-black px-12 py-4 rounded-lg font-black text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
            COMING SOON
          </div>
          
          <p className="text-gray-600">
            Launch pricing will be announced Q2 2024. Early adopters get lifetime discounts.
          </p>
        </div>
      </section>

      {/* Organization Portals Section */}
      <section id="portal" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-400 rotate-45 hidden lg:block"></div>
          
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              ORGANIZATION PORTALS
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every skate school gets their own branded portal for secure, organized access.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-50 border-2 border-blue-600 rounded-lg px-6 py-3 inline-block mb-6">
                <span className="text-blue-600 font-mono text-lg">tryeleve.com/your-school-name/login</span>
              </div>
              <p className="text-gray-600 mb-8">
                Students, parents, and coaches access their dedicated portal using your organization&apos;s unique URL.
              </p>
              <Link 
                href="#portal" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block"
              >
                FIND YOUR PORTAL
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-12 h-12 bg-red-400 rounded-full hidden lg:block"></div>
          <div className="absolute bottom-10 left-1/4 w-8 h-8 bg-blue-600 transform rotate-45 hidden lg:block"></div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            READY TO START YOUR SCHOOL?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join skateboarding schools worldwide who are already using Elevé to
            transform their coaching experience and accelerate student progress.
          </p>
          <Link 
            href="/start-school" 
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-12 py-4 rounded-lg font-black text-lg transition-colors border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] inline-block"
          >
            START YOUR SCHOOL
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-black text-gray-900 mb-4">PLATFORM</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#features" className="hover:text-gray-900">Features</Link></li>
                <li><Link href="#audience" className="hover:text-gray-900">Who It&apos;s For</Link></li>
                <li><Link href="#portal" className="hover:text-gray-900">Portal Access</Link></li>
                <li><Link href="/admin-login" className="hover:text-gray-900">Admin Login</Link></li>
                <li><Link href="#pricing" className="hover:text-gray-900">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-black text-gray-900 mb-4">COMPANY</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/about" className="hover:text-gray-900">About Elevé</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900">Contact Us</Link></li>
                <li><Link href="/careers" className="hover:text-gray-900">Careers</Link></li>
                <li><Link href="/press" className="hover:text-gray-900">Press Kit</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-black text-gray-900 mb-4">SUPPORT</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/help" className="hover:text-gray-900">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-gray-900">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-gray-900">API Reference</Link></li>
                <li><Link href="/status" className="hover:text-gray-900">System Status</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-black text-gray-900 mb-4">COMMUNITY</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="https://discord.gg/eleve" className="hover:text-gray-900">Discord</Link></li>
                <li><Link href="https://instagram.com/eleve" className="hover:text-gray-900">Instagram</Link></li>
                <li><Link href="https://youtube.com/eleve" className="hover:text-gray-900">YouTube</Link></li>
                <li><Link href="/blog" className="hover:text-gray-900">Blog</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; 2024 Elevé. All rights reserved. | Transforming skate education, one trick at a time. 🛹</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
