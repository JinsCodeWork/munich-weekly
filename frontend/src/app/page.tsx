// app/page.tsx
import { Container } from '@/components/ui/Container';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <Container>
        {/* Temporary content placeholder, will be replaced with Hero and Gallery components */}
        <div className="text-center my-20">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-4">
            Coming soon
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hero + Gallery
          </p>
        </div>
      </Container>
    </main>
  );
}