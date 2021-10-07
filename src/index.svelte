<script>
  import { tick } from 'svelte';

  export let bg;
  export let bgAlt;
  export let loadContent;
  export let hinges = '';

  let img;

  const doors = Array.apply(null, Array(24)).map((v, i) => ({ id: i + 1 }));

  async function open({ id, cover, content })
  {
    const { classList, offsetLeft, offsetTop } = cover.parentNode;

    if (classList.contains('open'))
    {
      // TODO hide content after animation has finished
      classList.remove('open');
    }
    else try
    {
      cover.style.background = `url(${img.src}) -${offsetLeft + 1}px -${offsetTop + 1}px / ${img.width}px ${img.height}px`;
      content.innerHTML = await loadContent(id);

      await tick();

      classList.add('open');
    }
    catch(err)
    {
      // TODO add user feedback like flashing animation
      console.error(err);
    }
  }
</script>

<style>
  img
  {
    max-width: 100%;
  }

  .holder
  {
    position: relative;
    box-sizing: border-box;
  }

  .holder *,
  .holder *::before,
  .holder *::after
  {
    box-sizing: inherit;
  }

  .full-absolute
  {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .doors
  {
    display: grid;
    grid-template-columns: repeat(4, 100px [col-start]);
    justify-content: space-evenly;
    align-content: space-evenly;
  }

  .door
  {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    border: 1px dashed rgba(255, 255, 255, .75);
    border-left-style: solid;
    color: #fff;
  }

  .door .cover
  {
    --open-angle: -105deg;

    display: flex;
    justify-content: center;
    align-items: center;
    transform-origin: left;
    transition: transform .5s ease-in-out;
    cursor: pointer;
  }

  .hinges-right .door .cover
  {
    --open-angle: 105deg;
    transform-origin: right;
  }

  .door .content
  {
    background: #333;
    opacity: 0;
    transition: opacity .5s ease-in-out;
  }

  .door .back
  {
    background: #999;
    opacity: 0;
    transition: opacity .25s ease-in;
  }

  :global(.door.open) .cover
  {
    transform: perspective(1200px) translate3d(0, 0, 0) rotateY(var(--open-angle));
    border: 1px solid #fff;
    filter: drop-shadow(-4px 4px 10px #000);
  }

  :global(.door.open) .content
  {
    opacity: 1;
  }

  :global(.door.open) .back
  {
    transition: opacity .25s ease-in .25s;
    opacity: .9;
  }
</style>

<div class="holder">
  <img bind:this={img} src={bg} alt={bgAlt}>
  <div class="doors full-absolute hinges-{hinges}">
    {#each doors as door}
      <div class="door">
        <div class="full-absolute content" bind:this={door.content}></div>
        <div class="full-absolute cover" bind:this={door.cover} on:click={() => open(door)}>
          {door.id}
          <div class="full-absolute back"></div>
        </div>
      </div>
    {/each}
  </div>
</div>
