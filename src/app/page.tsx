import Image from "next/image";

export default function Home() {
  return (
    <main className=" min-h-screen bg-gradient-to-b from-white to-gray-50/50 flex justify-center items-center ">
      <div className="absolute inset-0 -z-10  h-full w-full bg-white  bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:6rem_4rem]  "></div>
      <section >
        { /*  this is the hero section , NB: one of the tips from the OWASP testing framework don't write any related information about your backend */}
        <header>
          <h1>AI Agent Assistant </h1>
          <p>Meet you new Ai chat companion that goes beyond conversion -it can actually get things done 
          <span>Powered by IBM&apos; WxTools & your favorite  LLM&apos;</span>
          </p>
          
        </header>
      </section>
    </main>
    
  );
}
