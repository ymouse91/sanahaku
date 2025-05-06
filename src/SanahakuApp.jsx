import { useState, useRef } from "react";
import { wordList } from "./wordList";
import "./App.css";

const sanaSet = new Set(wordList);

export default function SanahakuApp() {
  const [sana, setSana] = useState("");
  const [tulos, setTulos] = useState(null);
  const [tila, setTila] = useState("idle"); // idle | loading | valmis | virhe
  const inputRef = useRef(null);

  const haeMerkitys = async () => {
    const sanaTrim = sana.trim().toLowerCase();
    if (!sanaSet.has(sanaTrim)) {
      setTulos(`Sanaa '${sanaTrim}' ei löydy sanalistasta.`);
      setTila("valmis");
      return;
    }

    setTila("loading");
    try {
      // 1. Yritetään Wikipediaa
      const response = await fetch(
        `https://fi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          sanaTrim
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.extract) {
          setTulos(`${data.extract} (Lähde: Wikipedia)`);
          setTila("valmis");
          return;
        }
      }

      // 2. Jos Wikipedia ei toiminut, yritetään Wikisanakirjaa
      const wikiSanakirjaResponse = await fetch(
        `https://fi.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(
          sanaTrim
        )}&prop=text&formatversion=2&format=json&origin=*`
      );

      if (wikiSanakirjaResponse.ok) {
        const data = await wikiSanakirjaResponse.json();
        const htmlText = data.parse?.text || "";
        const määritelmä = htmlText.match(/<li>(.*?)<\/li>/i)?.[1];
        if (määritelmä) {
          const plain = määritelmä.replace(/<[^>]+>/g, "");
          setTulos(`${plain} (Lähde: Wikisanakirja)`);
        } else {
          setTulos(`Sanaa '${sanaTrim}' ei löytynyt Wikipediasta tai Wikisanakirjasta.`);
        }
      } else {
        setTulos(`Sanaa '${sanaTrim}' ei löytynyt Wikipediasta tai Wikisanakirjasta.`);
      }
    } catch (err) {
      setTulos("Virhe haettaessa tietoa internetistä.");
    }
    setTila("valmis");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      haeMerkitys();
    }
  };

  const nollaa = () => {
    setSana("");
    setTulos(null);
    setTila("idle");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="container">
      <div className="logo-wrapper">
        <img src="/logo.png" alt="Tavukolmio Logo" className="logo" />
      </div>
      <h1 className="title">Sanahaku</h1>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          placeholder="Anna suomenkielinen sana"
          value={sana}
          onChange={(e) => setSana(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={haeMerkitys}>Hae merkitys</button>
      </div>
      {tila === "loading" && <p>Haetaan tietoa...</p>}
      {tulos && (
        <div className="card">
          <div className="card-content">
            <p className="result-text">{tulos}</p>
            <button onClick={nollaa}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
