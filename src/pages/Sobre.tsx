import SiteLayout from "@/components/site/SiteLayout";
import { Heart, Award, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import martinianaImg from "@/assets/fotos/martiniana-escada-sorriso.jpg";
import cafeImg from "@/assets/fotos/martiniana-escada-olhar.jpg";
import noiteImg from "@/assets/fotos/martiniana-entardecer.jpg";
import sorrisoImg from "@/assets/fotos/martiniana-riso-folhagem.jpg";
import escritorioImg from "@/assets/fotos/martiniana-blazer-retrato.jpg";
import pilarImg from "@/assets/fotos/martiniana-pilar.jpg";
import bancoRindoImg from "@/assets/fotos/martiniana-banco-rindo.jpg";
import oculosImg from "@/assets/fotos/martiniana-oculos-corda.jpg";
import jardimImg from "@/assets/fotos/martiniana-jardim.jpg";
import bancoOlharImg from "@/assets/fotos/martiniana-banco-olhar.jpg";

export default function Sobre() {
  return (
    <SiteLayout>
      <section className="py-16 lg:py-24 gradient-soft">
        <div className="container-prose grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Quem está por trás</span>
            <h1 className="font-display text-4xl lg:text-5xl mt-4 text-foreground">Marta Cury</h1>
            <p className="mt-3 text-lg text-muted-foreground italic">Consultora financeira, palestrante e fundadora da RM Consultoria.</p>
            <p className="mt-6 text-foreground/85 leading-relaxed">
              Sou mulher, mãe, esposa e profissional de finanças há mais de 20 anos. Passei pelas mesmas dificuldades que você ou alguém da sua família já viveu. E foi exatamente por isso que me tornei consultora financeira.
            </p>
            <p className="mt-4 text-foreground/85 leading-relaxed">
              Acredito que cuidar do dinheiro é cuidar da paz dentro de casa. Minha missão é traduzir o "complicado" em passos simples, com o Método GCPM e muito acolhimento — porque ninguém merece carregar essa angústia sozinho.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl gradient-warm opacity-15 blur-2xl" />
            <img src={martinianaImg} alt="Marta Cury" width={1066} height={1600} className="relative rounded-3xl shadow-warm w-full" />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-prose">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl lg:text-4xl">No que acreditamos</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart, t: "Acolhimento", d: "Sem julgamento. Toda história merece um recomeço." },
              { icon: Award, t: "Excelência", d: "Método GCPM testado em mais de 1.200 atendimentos." },
              { icon: Users, t: "Comunidade", d: "Você não caminha sozinho — somos uma rede." },
              { icon: Sparkles, t: "Esperança", d: "Liberdade financeira é fruto de hábitos diários." },
            ].map((v) => (
              <div key={v.t} className="p-7 rounded-3xl bg-card border border-border shadow-card text-center">
                <div className="w-12 h-12 rounded-2xl gradient-warm grid place-items-center mx-auto">
                  <v.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl mt-5">{v.t}</h3>
                <p className="text-sm text-muted-foreground mt-2">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section className="py-16 lg:py-20 bg-secondary/40">
        <div className="container-prose">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Bastidores</span>
            <h2 className="font-display text-3xl lg:text-4xl mt-3">Momentos que inspiram</h2>
            <p className="mt-4 text-muted-foreground">Da rotina aos eventos: a leveza por trás de quem cuida de tantas histórias.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {[
              { src: escritorioImg, alt: "Marta Cury, consultora financeira" },
              { src: cafeImg, alt: "Marta Cury sorrindo na escadaria" },
              { src: noiteImg, alt: "Marta Cury ao entardecer" },
              { src: sorrisoImg, alt: "Marta Cury sorrindo entre as folhagens" },
              { src: bancoRindoImg, alt: "Marta Cury sorrindo sentada no banco" },
              { src: oculosImg, alt: "Marta Cury de óculos no jardim" },
              { src: jardimImg, alt: "Marta Cury caminhando no jardim" },
              { src: bancoOlharImg, alt: "Marta Cury sentada à mesa de madeira" },
              { src: pilarImg, alt: "Marta Cury encostada no pilar de madeira" },
            ].map((img, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-3xl shadow-card group ${
                  i === 0 ? "lg:row-span-2 lg:col-span-2 aspect-square lg:aspect-auto" : "aspect-[3/4]"
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 pt-16">

        <div className="container-prose">
          <div className="rounded-[2rem] p-10 lg:p-14 gradient-sage text-sage-foreground text-center">
            <h2 className="font-display text-3xl lg:text-4xl">Pronto para escrever um novo capítulo?</h2>
            <Button asChild size="lg" className="mt-7 rounded-full h-12 px-7 bg-white text-sage hover:bg-white/90">
              <Link to="/diagnostico">Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
