import Image from "next/image";

export default function Home() {
  return (
    <main className=" min-h-screen bg-gradient-to-b from-white to-gray-50/50 flex justify-center items-center ">
      <div className="absolute inset-0 -z-10  h-full w-full bg-white  bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:6rem_4rem]  "></div>
      <section className="flex flex-col w-full max-w-7xl space-y-10 items-center text-center px-4 py-6 sm:px-6 lg:px-8 mx-auto" >
        { /*  this is the hero section , NB: one of the tips from the OWASP testing framework don't write any related information about your backend */}
        <header className="space-y-5">
          <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent py-2 tracking-tight">AI Agent Assistant </h1>
          <p className="sm:text-xl/relaxed xl:text-2xl/relaxed text-lg text-gray-600 max-w-[600px]">Meet your new AI chat companion that goes beyond conversation - it
            can actually get things done!
            <br />
          <span className="text-gray-400 text-sm">Powered by IBM&apos; WxTools & your favorite  LLM&apos;s</span>
          </p>
          
        </header>
      </section>
    </main>
    
  );
}
